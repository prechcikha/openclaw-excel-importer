import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { executeImport, getImportStatus } from '../api';

const ImportProgress = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { mappings, total_rows, preview } = location.state || {};
  
  const [mode, setMode] = useState('insert'); // insert, update, upsert
  const [matchKeyColumn, setMatchKeyColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Check if previous import exists for this job
    checkPreviousResult();
    
    // Polling interval to check import status (every 2 seconds)
    const pollInterval = setInterval(async () => {
      if (loading) return;
      try {
        const response = await getImportStatus(filename);
        setStatus(response.data);
        
        if (response.status === 'completed') {
          // Show results page
          navigate(`/import/${filename}/results`, { state: response });
        } else if (response.status === 'failed') {
          setStatus({ ...response, success: false });
        }
      } catch (error) {
        console.log('Import not found or error:', error.message);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [loading, filename]);

  const checkPreviousResult = async () => {
    try {
      const response = await getImportStatus(filename);
      setStatus(response.data);
      
      if (response.status === 'completed') {
        // Show results page
        navigate(`/import/${filename}/results`, { state: response });
      }
    } catch (error) {
      console.log('No previous import found');
    }
  };

  const handleImport = async () => {
    setLoading(true);
    
    try {
      // Extract import_id from filename (format: job_TIMESTAMP_filename)
      const parts = filename.split('_');
      const importId = parts.length > 2 ? parts[parts.length - 2] : null;
      
      if (!importId) {
        alert('Could not extract import ID. Please re-upload the file.');
        setLoading(false);
        return;
      }

      // Prepare mapping data for API
      const mappingData = mappings.map(m => ({
        excel_column: m.excel_column,
        target_field: m.target_column || '',
        skip: m.skip
      }));

      const config = {
        import_id: importId,
        mode: mode,
        mappings: mappingData,
        rows_count: total_rows || preview.length
      };

      if (mode === 'update' && matchKeyColumn) {
        config.match_key_column = matchKeyColumn;
      }

      // Execute import via API
      const response = await executeImport(importId, config);

      if (response.success) {
        setStatus({ 
          success: true,
          records_imported: response.data.records_imported || 0,
          records_failed: response.data.records_failed || 0,
          duration_ms: response.data.duration_ms || 0,
          message: `Import completed! ${response.data.records_imported} rows imported.`
        });
      } else {
        setStatus({ 
          success: false, 
          error: response.error || response.message || 'Import failed'
        });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || 'Import execution failed';
      setStatus({ success: false, error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const renderModeOptions = () => (
    <div className="card">
      <div className="card-header bg-primary text-white">
        Import Mode
      </div>
      <div className="card-body">
        <label className="form-label d-block mb-3">Choose how to import data:</label>
        
        <div className="mb-3">
          <input 
            type="radio" 
            id="insert_mode" 
            name="import_mode" 
            value="insert" 
            checked={mode === 'insert'}
            onChange={(e) => setMode(e.target.value)}
          />
          <label className="form-label ms-2" htmlFor="insert_mode">
            Insert New Records Only
            <br/>
            <small className="text-muted">Adds all rows as new records. No duplicates allowed.</small>
          </label>
        </div>

        <div className="mb-3">
          <input 
            type="radio" 
            id="update_mode" 
            name="import_mode" 
            value="update" 
            checked={mode === 'update'}
            onChange={(e) => setMode(e.target.value)}
          />
          <label className="form-label ms-2" htmlFor="update_mode">
            Update Existing Records
            <br/>
            <small className="text-muted">Finds existing records by match key and updates them.</small>
          </label>
          
          {mode === 'update' && (
            <div className="mt-3">
              <label className="form-label">Match Key Column</label>
              <select 
                className="form-select" 
                value={matchKeyColumn}
                onChange={(e) => setMatchKeyColumn(e.target.value)}
              >
                <option value="">Select column to match on...</option>
                {mappings.map((m, i) => !m.skip && (
                  <option key={i} value={m.excel_column}>{m.excel_column}</option>
                ))}
              </select>
              <small className="text-muted">This column's unique values will be used to find existing records.</small>
            </div>
          )}
        </div>

        <div className="mb-3">
          <input 
            type="radio" 
            id="upsert_mode" 
            name="import_mode" 
            value="upsert"
            checked={mode === 'upsert'}
            onChange={(e) => setMode(e.target.value)}
            disabled
          />
          <label className="form-label ms-2" htmlFor="upsert_mode">
            Upsert (Insert or Update)
            <br/>
            <small className="text-muted">Inserts new records and updates existing ones.</small>
          </label>
        </div>

        <div className={`alert alert-${mode === 'insert' ? 'success' : mode === 'update' ? 'info' : 'warning'} mt-3`}>
          {mode === 'insert' && 'New records will be added to the table.'}
          {mode === 'update' && `Records will match on: ${matchKeyColumn || 'not specified'}`}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="card">
      <div className="card-header bg-info text-white">
        Data Preview & Summary
      </div>
      <div className="card-body">
        <p><strong>Total rows to import:</strong> {total_rows || preview.length}</p>
        
        {preview && (
          <>
            <h6>First 5 rows:</h6>
            <table className="table table-sm table-bordered mb-0">
              <thead>
                <tr>{preview[0].map((cell, i) => <th key={i}>{cell.header}</th>)}</tr>
              </thead>
              <tbody>
                {preview.slice(1, 6).map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx}>{cell.value || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="card">
      <div className="card-header bg-warning text-dark">
        Import in Progress...
      </div>
      <div className="card-body">
        <div className="progress mb-3" style={{ height: '25px' }}>
          <div 
            className="progress-bar progress-bar-striped progress-bar-animated" 
            role="progressbar" 
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
        
        <p>Processing {total_rows || preview.length} rows...</p>
        
        <ul className="list-unstyled">
          <li>✓ Reading Excel file</li>
          <li>✓ Validating data structure</li>
          <li>⏳ Importing to database... ({progress}%)</li>
        </ul>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="card">
      <div className={`card-header ${status.success ? 'bg-success text-white' : 'bg-danger text-white'}`}>
        {status.success ? `Import Completed!` : 'Import Failed'}
      </div>
      <div className="card-body">
        {status.success && (
          <>
            <h5 className="mb-3">Results</h5>
            
            <div className="alert alert-success mb-3">
              Successfully imported data to MSSQL database!
            </div>

            {status.records_imported !== undefined && (
              <>
                <p><strong>Total rows processed:</strong> {total_rows || preview.length}</p>
                <p><strong>Rows successfully imported:</strong> {status.records_imported}</p>
                {status.records_failed > 0 && (
                  <p className="text-danger"><strong>Failed rows:</strong> {status.records_failed}</p>
                )}
                {status.duration_ms !== undefined && (
                  <p><strong>Import duration:</strong> {(status.duration_ms / 1000).toFixed(2)} seconds</p>
                )}
              </>
            )}
            
            <h6 className="mt-4">Next Steps:</h6>
            <ul>
              <li>Verify data in your MSSQL server</li>
              <li>Check for any errors or warnings</li>
              <li><a href="/upload" className="text-primary">Upload another file</a></li>
              <li><button className="btn btn-secondary btn-sm ms-2" onClick={() => navigate('/upload')}>Back to Upload</button></li>
            </ul>
          </>
        )}

        {!status.success && (
          <div className="alert alert-danger">
            Import failed: {status.error || 'Unknown error'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <h1>Import Configuration</h1>
      
      {!loading && status !== null ? renderResults() : (
        <>
          {renderModeOptions()}
          
          {mode === 'update' && matchKeyColumn && (
            <div className="alert alert-info mt-3">
              Match key column selected: <strong>{matchKeyColumn}</strong>
            </div>
          )}

          {preview && preview.length > 0 && renderPreview()}

          <div className="card mt-4">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <span>Execute Import</span>
              <span>Total: {total_rows || preview.length} rows</span>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Review your column mappings and import settings before proceeding.
              </p>

              {!matchKeyColumn && mode === 'update' && (
                <div className="alert alert-warning mb-3">
                  ⚠️ Please select a match key column for UPDATE mode
                </div>
              )}

              <button 
                className={`btn btn-primary ${!matchKeyColumn || mode !== 'update' ? '' : 'disabled'}`} 
                onClick={handleImport}
                disabled={loading || !matchKeyColumn || mode === 'update'}
              >
                {loading ? 'Importing...' : `Execute Import (${total_rows || preview.length} rows)`}
              </button>

              <button 
                className="btn btn-secondary ms-2" 
                onClick={() => navigate('/map/' + filename)}
              >
                ← Back to Mapping
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportProgress;
