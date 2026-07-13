import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Connection Management
export const testConnection = async (config) => {
  const response = await api.post('/api/connection/test', config);
  return response.data;
};

export const getConfigureForm = async () => {
  const response = await api.get('/api/connection/configure');
  return response.data;
};

// File Upload
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getColumns = async (filename) => {
  const response = await api.get(`/api/upload/${filename}/columns`);
  return response.data;
};

export const previewData = async (filename, rowsLimit = 100) => {
  const response = await api.post('/api/upload/preview', { filename, rows_limit: rowsLimit });
  return response.data;
};

// Column Mapping
export const saveMapping = async (jobId, mappingData) => {
  const response = await api.post('/api/mapping/save', { job_id: jobId, mapping: mappingData });
  return response.data;
};

export const getMapping = async (jobId) => {
  const response = await api.get(`/api/mapping/${jobId}`);
  return response.data;
};

export const deleteMapping = async (jobId) => {
  const response = await api.delete(`/api/mapping/${jobId}`);
  return response.data;
};

// Import Execution
export const executeImport = async (jobId, config) => {
  const response = await api.post('/api/import/execute', { job_id: jobId, config });
  return response.data;
};

export const getImportStatus = async (jobId) => {
  const response = await api.get(`/api/import/${jobId}/status`);
  return response.data;
};

export const getImportResult = async (jobId) => {
  const response = await api.post('/api/import/result', { job_id: jobId });
  return response.data;
};

export default api;
