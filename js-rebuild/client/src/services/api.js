// API Service - Centralized API calls for Excel Importer Frontend
const API_BASE_URL = '/api';

// Helper function to handle API responses and errors
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        throw error;
    }
}

// ==========================================================================
// CONNECTIONS API
// ==========================================================================

export async function saveConnection(data) {
    const response = await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response;
}

export async function getConnections() {
    return apiRequest('/connections');
}

export async function getConnectionById(id) {
    return apiRequest(`/connections/${id}`);
}

export async function updateConnection(id, data) {
    const response = await apiRequest(`/connections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response;
}

export async function deleteConnection(id) {
    return apiRequest(`/connections/${id}`, {
        method: 'DELETE'
    });
}

export async function testConnection(host, port, database, username, password) {
    const response = await apiRequest('/connections/test', {
        method: 'POST',
        body: JSON.stringify({ host, port, database, username, password })
    });
    return response;
}

// ==========================================================================
// IMPORTS API
// ==========================================================================

export async function uploadFile(file, connectionId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('connection_id', connectionId);

    const response = await fetch(`${API_BASE_URL}/imports/upload`, {
        method: 'POST',
        body: formData
    });

    return response.json();
}

export async function saveColumnMapping(importId, fileId, mappings) {
    return apiRequest('/imports/mapping', {
        method: 'POST',
        body: JSON.stringify({ import_id: importId, file_id: fileId, mappings })
    });
}

export async function executeImport(importId, connectionId, targetTable) {
    return apiRequest('/imports/execute', {
        method: 'POST',
        body: JSON.stringify({ import_id: importId, file_id: importId, connection_id: connectionId, target_table: targetTable })
    });
}

export async function getImportHistory(limit = 10, offset = 0, status = null) {
    let params = `?limit=${limit}&offset=${offset}`;
    if (status) {
        params += `&status=${status}`;
    }
    return apiRequest(`/imports/history${params}`);
}

export async function getImportDetails(importId) {
    return apiRequest(`/imports/${importId}`);
}

export async function deleteImport(importId) {
    return apiRequest(`/imports/${importId}`, {
        method: 'DELETE'
    });
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Export all APIs as default for convenience
export default {
    connections: {
        saveConnection,
        getConnections,
        getConnectionById,
        updateConnection,
        deleteConnection,
        testConnection
    },
    imports: {
        uploadFile,
        saveColumnMapping,
        executeImport,
        getImportHistory,
        getImportDetails,
        deleteImport
    },
    utils: {
        formatFileSize,
        formatDate
    }
};
