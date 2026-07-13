import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';

const ImportHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [limit, offset, filterStatus]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/imports/history', {
        params: { limit, offset, status: filterStatus === 'all' ? undefined : filterStatus }
      });

      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Error loading import history:', error);
      alert('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-danger';
      case 'ready': return 'bg-info text-dark';
      case 'importing': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'ready': return 'Ready for Import';
      case 'importing': return 'Importing...';
      default: return status || 'Unknown';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this import record?')) return;
    
    try {
      await api.delete(`/api/imports/${id}`);
      loadHistory(); // Reload history
    } catch (error) {
      console.error('Error deleting import:', error);
      alert('Failed to delete import record');
    }
  };

  const handleViewDetails = (id) => {
    // Could navigate to a details page
    window.open(`http://localhost:3000/api/imports/${id}`, '_blank');
  };

  return (
    <div className="container mt-5">
      <h1>Import History</h1>
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <label className="form-label fw-bold">Filter by Status</label>
              <select 
                className="form-select" 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Imports</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="ready">Ready for Import</option>
                <option value="importing">Importing...</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Show</label>
              <div className="input-group">
                <span className="input-group-text">Records</span>
                <input 
                  type="number" 
                  className="form-control" 
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="col-md-4 text-end">
              {history.length > 0 && (
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setOffset(offset - 10)}
                  disabled={offset === 0}
                >
                  Previous
                </button>
              )}
              <span className="text-muted">
                Showing {((offset / 10) + 1) * 10} records total
              </span>
              {history.length > 0 && (
                <button 
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => setOffset(offset + 10)}
                  disabled={(offset + 10) >= history.length}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading import history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <svg className="bi bi-inbox display-1 text-muted" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.04 2.36a2 2 0 0 1 .79-.64l.865-.349A1 1 0 0 1 3.422 2h8.156a1 1 0 0 1 .522.371l.865.349a2 2 0 0 1 .79.64 2 2 0 0 1 .1 2.42l-.5.805A1 1 0 0 1 13 6.75H3a1 1 0 0 1-.884-.57l-.5-.805a2 2 0 0 1 .1-2.42zm2.97 1.72V12h8.06V4.08H3.01zM1 6.75h14v6.25a1.75 1.75 0 0 1-1.75 1.75h-10.5A1.75 1.75 0 0 1 1 13V6.75z"/>
          </svg>
          <h4 className="mt-3 mb-2">No Import History</h4>
          <p>No files have been imported yet.</p>
          <a href="/upload" className="btn btn-primary mt-3">Upload Your First File</a>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped shadow-sm">
            <thead className="table-dark sticky-top">
              <tr>
                <th>ID</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Columns</th>
                <th>Status</th>
                <th>Date</th>
                <th>Records</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((importRecord) => (
                <tr key={importRecord.id}>
                  <td>
                    <code>{importRecord.id}</code>
                  </td>
                  <td className="text-truncate" style={{maxWidth: '200px'}}>
                    {importRecord.file_name}
                  </td>
                  <td>
                    {(importRecord.file_size || 0) / (1024 * 1024).toFixed(2)} MB
                  </td>
                  <td>{importRecord.columns_count}</td>
                  <td>
                    <span className={`badge ${getStatusColor(importRecord.status)}`}>
                      {getStatusText(importRecord.status)}
                    </span>
                  </td>
                  <td>{formatDate(importRecord.upload_date)}</td>
                  <td>
                    <small>
                      Imported: {importRecord.records_imported || 0}<br/>
                      Failed: {importRecord.records_failed || 0}
                    </small>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => handleViewDetails(importRecord.id)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(importRecord.id)}
                        title="Delete Record"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics Card */}
      <div className="row mt-5">
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card bg-success text-white shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Completed Imports</h6>
              <h2 className="display-4">
                {history.filter(h => h.status === 'completed').length}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card bg-danger text-white shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Failed Imports</h6>
              <h2 className="display-4">
                {history.filter(h => h.status === 'failed').length}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card bg-info text-white shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Ready to Import</h6>
              <h2 className="display-4">
                {history.filter(h => h.status === 'ready').length}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card bg-warning text-dark shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title">Currently Importing</h6>
              <h2 className="display-4">
                {history.filter(h => h.status === 'importing').length}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportHistory;
