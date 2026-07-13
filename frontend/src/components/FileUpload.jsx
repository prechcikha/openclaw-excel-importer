import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    // Upload file and get column info
    uploadAndParse();
  };

  const uploadAndParse = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:8000/api/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setColumns(response.data.columns);
        setResult({ success: true, filename: response.data.filename, total_rows: response.data.total_rows });
        
        // Auto-preview first 10 rows
        await previewData(10);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('File upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const previewData = async (limit = 10) => {
    try {
      if (!file) return;
      
      const response = await axios.post('http://localhost:8000/api/upload/preview', {
        filename,
        rows_limit: limit
      });

      setPreview(response.data.rows);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartMapping = () => {
    if (!file || columns.length === 0) {
      alert('Please upload a valid Excel file first');
      return;
    }

    // Generate unique job ID (using filename as key for simplicity)
    const jobId = `job_${Date.now()}_${fileName.replace(/\s+/g, '_').toLowerCase()}`;
    
    navigate(`/map/${jobId}`, { state: { columns, preview, total_rows: result?.total_rows || 0 } });
  };

  return (
    <div className="container mt-5">
      <h1>Upload Excel File</h1>
      
      {!result ? (
        <div className="card">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Select File</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={loading} />
              {fileName && <p className="text-muted mt-2">Selected: {fileName}</p>}
            </div>

            <div className={`alert alert-info ${loading ? 'd-none' : ''}`}>
              Supported formats: .xlsx, .xls, .csv<br/>
              Max file size: 5MB
            </div>

            {!loading && (
              <button 
                className="btn btn-primary" 
                onClick={handleStartMapping}
                disabled={!file || columns.length === 0}
              >
                Continue to Column Mapping →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'} mb-0`}>
            {result.message || 'File uploaded successfully!'}
            {result.total_rows && `, Total rows: ${result.total_rows}`}
          </div>

          <h5 className="mt-4">Detected Columns ({columns.length})</h5>
          
          <table className="table table-striped table-sm mb-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Column Name</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{col.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {preview && preview.length > 0 && (
            <>
              <h5 className="mt-4">Data Preview ({Math.min(preview.length, 10)} rows shown)</h5>
              <div className="table-responsive mb-3">
                <table className="table table-sm">
                  <thead>
                    <tr>{preview[0].map((cell, i) => <th key={i}>{cell.header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx}>{cell.value || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <button className="btn btn-success" onClick={handleStartMapping}>
            Start Column Mapping →
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
