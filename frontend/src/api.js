import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
export const uploadFile = async (file, connection_id) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (connection_id && connection_id !== 'null' && connection_id !== undefined) {
    formData.append('connection_id', connection_id);
  }
  
  const response = await api.post('/api/imports/upload', formData, {
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
export const saveMapping = async (import_id, mappingData) => {
  const response = await api.post('/api/imports/mapping', { import_id, ...mappingData });
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
export const executeImport = async (import_id, config) => {
  const response = await api.post('/api/imports/execute', { import_id, ...config });
  return response.data;
};

export const getImportStatus = async (import_id) => {
  const response = await api.get(`/api/imports/${import_id}`);
  return response.data;
};

// Import History
export const getImportHistory = async (params = {}) => {
  const url = new URL('/api/imports/history', API_BASE_URL);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  const response = await api.get(url.toString());
  return response.data;
};

export default api;
