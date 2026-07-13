import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { saveMapping } from '../api';

const ColumnMapper = () => {
  const { filename } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get state from previous route
  const { columns, preview, total_rows } = location.state || {};
  
  const [mappings, setMappings] = useState(
    columns.map((col, index) => ({
      excel_column: col.name,
      target_table: 'your_table_name', // User will edit this
      target_column: '',
      skip: false,
      excel_index: index + 1
    }))
  );

  const [targetTableName, setTargetTableName] = useState('');

  const handleTableChange = (e) => {
    setTargetTableName(e.target.value);
  };

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...mappings];
    
    if (field === 'skip') {
      // If skipping a column, reset its target mapping
      newMappings[index] = { ...newMappings[index], [field]: value };
    } else {
      newMappings[index][field] = value;
    }
    
    setMappings(newMappings);
  };

  const handleAutoFillTarget = (index) => {
    // Auto-fill target column with same name as Excel column (lowercase, snake_case)
    const normalized = mappings[index].excel_column.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setMappings(mappings.map((m, i) => 
      i === index ? { ...m, target_column: normalized } : m
    ));
  };

  const handleNextStep = async () => {
    // Validate mappings
    let hasValidMapping = false;
    mappings.forEach(m => {
      if (!m.skip && m.target_column) {
        hasValidMapping = true;
      }
    });

    if (!hasValidMapping) {
      alert('Please map at least one column to a target table');
      return;
    }

    // Extract import_id from filename (format: job_TIMESTAMP_filename)
    const parts = filename.split('_');
    const importId = parts.length > 2 ? parts[parts.length - 2] : null; // Use timestamp as import_id
    
    if (!importId) {
      alert('Could not extract import ID from filename. Please re-upload the file.');
      return;
    }

    try {
      const mappingData = mappings.map(m => ({
        excel_column: m.excel_column,
        target_field: m.target_column || '',
        skip: m.skip
      }));

      // Save mapping to backend
      const response = await saveMapping(importId, { mappings: mappingData });
      
      if (response.success) {
        console.log('Mappings saved successfully');
        navigate('/import/' + filename, { 
          state: { mappings, total_rows, preview, import_id: importId }
        });
      } else {
        alert('Failed to save column mappings: ' + (response.error || response.message));
      }
    } catch (error) {
      console.error(error);
      alert('Error saving mappings: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderMappingRow = (mapping, index) => (
    <tr key={index} className={mapping.skip ? 'table-secondary' : ''}>
      <td>{mapping.excel_index}</td>
      <td>{mapping.excel_column}</td>
      
      {!mapping.skip && (
        <>
          <td><input type="text" className="form-control form-control-sm" value={targetTableName} readOnly /></td>
          <td>
            <div className="input-group input-group-sm">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Target column..." 
                value={mapping.target_column || ''}
                onChange={(e) => handleMappingChange(index, 'target_column', e.target.value)}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button" 
                onClick={() => handleAutoFillTarget(index)}
                title="Auto-fill with Excel column name (snake_case)"
              >
                ↪️
              </button>
            </div>
          </td>
        </>
      )}

      <td>
        <div className="form-check form-switch">
          <input 
            className="form-check-input" 
            type="checkbox" 
            checked={mapping.skip}
            onChange={(e) => handleMappingChange(index, 'skip', e.target.checked)}
            id={`skip-${index}`}
          />
          <label className="form-check-label" htmlFor={`skip-${index}`}>Skip</label>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="container mt-5">
      <h1>Column Mapping</h1>
      
      {preview && preview.length > 0 && (
        <p><strong>Total rows in file:</strong> {total_rows}</p>
      )}

      <div className="card mb-4">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <span>Target Table Configuration</span>
        </div>
        <div className="card-body">
          <label className="form-label">Target Table Name (in MSSQL)</label>
          <input 
            type="text" 
            className="form-control mb-3" 
            placeholder="e.g., customers, orders, products"
            value={targetTableName}
            onChange={handleTableChange}
            required={!mappings.some(m => m.skip)}
          />
          
          <div className="alert alert-info">
            Excel columns will be imported into this table. Columns marked as "Skip" won't be imported.
          </div>
        </div>
      </div>

      <h5 className="mb-3">Map Excel Columns to Database</h5>
      
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Excel Column</th>
            <th>Target Table</th>
            <th>Database Column</th>
            <th>Skip?</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(renderMappingRow)}
        </tbody>
      </table>

      <div className="d-flex justify-content-between mt-4">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/upload')}
        >
          ← Back to Upload
        </button>
        
        <button 
          className="btn btn-primary" 
          onClick={handleNextStep}
        >
          Next: Import Mode →
        </button>
      </div>

      {mappings.length === 0 && (
        <div className="alert alert-warning mt-3">
          No columns detected in your Excel file. Please re-upload a valid file.
        </div>
      )}
    </div>
  );
};

export default ColumnMapper;
