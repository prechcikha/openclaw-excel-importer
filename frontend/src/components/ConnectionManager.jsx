import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';

const ConnectionManager = ({ onSave, onDelete }) => {
  const [connections, setConnections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    server: '',
    host: 'localhost',
    port: 1433,
    database: '',
    username: 'sa',
    password: '',
    trusted_connection: false
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      // Note: This would need to be implemented in the backend
      // For now, using mock data
      setConnections([
        { id: 1, name: 'Local MSSQL Dev', server: 'localhost', database: 'tempdb' },
        { id: 2, name: 'Production Database', server: 'prod-mssql.company.com', database: 'production_db' }
      ]);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleSave = async () => {
    try {
      let result;
      if (editingConnection) {
        // Update existing connection
        result = await api.post('/api/connections/update', { id: editingConnection, ...formData });
      } else {
        // Create new connection
        result = await api.post('/api/connections/create', formData);
      }

      if (result.success) {
        onSave(result.data);
        setShowForm(false);
        setEditingConnection(null);
        loadConnections();
      }
    } catch (error) {
      console.error('Error saving connection:', error);
      alert('Failed to save connection: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection.id);
    setFormData({
      name: connection.name,
      server: connection.server,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: '', // Don't show password in form
      trusted_connection: connection.trusted_connection || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    
    try {
      await api.delete(`/api/connections/${id}`);
      onDelete(id);
      loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      alert('Failed to delete connection');
    }
  };

  const resetForm = () => {
    setEditingConnection(null);
    setFormData({
      name: '',
      server: '',
      host: 'localhost',
      port: 1433,
      database: '',
      username: 'sa',
      password: '',
      trusted_connection: false
    });
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    try {
      const result = await api.post('/api/connections/test', formData);
      
      if (result.success && result.data.latency_ms !== undefined) {
        alert(`Connection successful! Latency: ${result.data.latency_ms}ms`);
        
        // Save the connection automatically after successful test
        await handleSave();
      } else {
        alert('Connection test failed: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Failed to connect: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="container mt-5">
      <h1>Database Connections</h1>
      
      {/* Connection List */}
      {!showForm && (
        <>
          <div className="d-flex justify-content-between mb-4">
            <p className="text-muted">Manage your MSSQL server connections</p>
            <button 
              className="btn btn-primary"
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              + Add New Connection
            </button>
          </div>

          {connections.length === 0 ? (
            <div className="alert alert-info">No connections configured yet. Click "Add New Connection" to get started.</div>
          ) : (
            <div className="row">
              {connections.map(conn => (
                <div key={conn.id} className="col-md-6 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">{conn.name}</h5>
                      <hr/>
                      <dl className="row mb-3">
                        <dt className="col-sm-4">Server:</dt>
                        <dd className="col-sm-8">{conn.server || conn.host}:{conn.port}</dd>
                        
                        <dt className="col-sm-4">Database:</dt>
                        <dd className="col-sm-8"><code>{conn.database}</code></dd>
                        
                        <dt className="col-sm-4">Auth:</dt>
                        <dd className="col-sm-8">{conn.username} {conn.trusted_connection ? '(Windows Auth)' : '(SQL Login)'}</dd>
                      </dl>

                      <div className="d-flex gap-2 mt-3">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEdit(conn)}
                        >
                          Edit
                        </button>
                        
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(conn.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Connection Form */}
      {showForm && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span>{editingConnection ? 'Edit Connection' : 'Add New Connection'}</span>
                <button className="btn btn-sm btn-light" onClick={() => setShowForm(false)}>×</button>
              </div>
              
              <div className="card-body">
                {editingConnection && (
                  <button 
                    type="button" 
                    className="btn btn-danger mb-3"
                    onClick={() => handleDelete(editingConnection)}
                  >
                    Delete This Connection
                  </button>
                )}

                <form onSubmit={handleTestConnection}>
                  <h6>Connection Details</h6>
                  
                  <div className="mb-3">
                    <label className="form-label">Connection Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required={!editingConnection}
                      placeholder="e.g., Production Database"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Server Host *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.host}
                        onChange={(e) => setFormData({...formData, host: e.target.value})}
                        required
                        placeholder="e.g., localhost or server.example.com"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Port</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.port}
                        onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                        placeholder="1433"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Database Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.database}
                      onChange={(e) => setFormData({...formData, database: e.target.value})}
                      required={!editingConnection}
                      placeholder="Target MSSQL database name"
                    />
                  </div>

                  <h6>Authentication</h6>
                  
                  <div className="mb-3">
                    <label className="form-label">Username *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required={!editingConnection}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password *</label>
                    {editingConnection && (
                      <small className="text-muted">Leave blank to keep existing password</small>
                    )}
                    <input 
                      type="password" 
                      className="form-control" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingConnection}
                    />
                  </div>

                  <div className="mb-3 form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="trustedConnection"
                      checked={formData.trusted_connection}
                      onChange={(e) => setFormData({...formData, trusted_connection: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="trustedConnection">
                      Use Windows Authentication (Trusted Connection)
                    </label>
                  </div>

                  <hr/>

                  <div className="d-flex justify-content-between mt-4">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    
                    {editingConnection ? (
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!formData.name || !formData.host}
                      >
                        Save Changes
                      </button>
                    ) : (
                      <div>
                        <button 
                          type="submit" 
                          className="btn btn-outline-secondary me-2"
                          onClick={(e) => { e.preventDefault(); handleTestConnection(e); }}
                        >
                          Test Connection
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-success"
                          disabled={!formData.name || !formData.host}
                        >
                          Save & Add
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionManager;
