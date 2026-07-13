import React, { useState } from 'react';
import axios from 'axios';

const ConnectionConfig = () => {
  const [config, setConfig] = useState({
    server: '',
    database: '',
    trusted_connection: true,
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/connection/test', config);
      setResult(response.data);
      
      if (response.data.success) {
        alert(`Connection successful! Server: ${config.server}, Database: ${config.database}`);
      } else {
        alert(`Connection failed: ${response.data.message}`);
      }
    } catch (error) {
      alert('Connection test failed. Please check your server details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Save configuration to localStorage for session persistence
    localStorage.setItem('mssql_config', JSON.stringify(config));
    alert('Configuration saved!');
  };

  return (
    <div className="container mt-5">
      <h1>Excel to MSSQL Importer</h1>
      <p className="lead">Configure your remote Microsoft SQL Server connection</p>
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          Connection Configuration
        </div>
        <div className="card-body">
          <form onSubmit={(e) => { e.preventDefault(); handleTestConnection(); }}>
            <div className="mb-3">
              <label className="form-label">Server Name</label>
              <input
                type="text"
                name="server"
                className="form-control"
                value={config.server}
                onChange={handleChange}
                placeholder="e.g., localhost or your-server.database.windows.net"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Database Name</label>
              <input
                type="text"
                name="database"
                className="form-control"
                value={config.database}
                onChange={handleChange}
                placeholder="e.g., tempdb or your_database_name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label d-block">Authentication Method</label>
              
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="auth_type"
                  id="trusted_auth"
                  value="true"
                  checked={config.trusted_connection}
                  onChange={(e) => setConfig({ ...config, trusted_connection: e.target.value === 'true' })}
                />
                <label className="form-check-label" htmlFor="trusted_auth">
                  Windows Authentication (Trusted Connection)
                </label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="auth_type"
                  id="sql_auth"
                  value="false"
                  checked={!config.trusted_connection}
                  onChange={(e) => setConfig({ ...config, trusted_connection: e.target.value === 'true' })}
                />
                <label className="form-check-label" htmlFor="sql_auth">
                  SQL Server Login
                </label>
              </div>

              {!config.trusted_connection && (
                <>
                  <div className="mb-2 mt-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={config.username}
                      onChange={handleChange}
                      required={!config.trusted_connection}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={config.password}
                      onChange={handleChange}
                      required={!config.trusted_connection}
                    />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button type="button" className="btn btn-success ms-2" onClick={handleSave}>
              Save Configuration
            </button>
          </form>

          {result && (
            <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'} mt-3`}>
              {result.message}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-info text-white">
          How to use
        </div>
        <div className="card-body">
          <ol>
            <li>Enter your MSSQL server address (e.g., localhost for SQL Express, or your remote server)</li>
            <li>Select authentication method (Windows Auth recommended)</li>
            <li>Click "Test Connection" to verify settings</li>
            <li>Click "Save Configuration" to store for this session</li>
            <li>Proceed to upload Excel files!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ConnectionConfig;
