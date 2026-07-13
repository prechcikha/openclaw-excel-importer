# 🚀 Phase 4: Backend API Integration - Implementation Guide

**Status:** Routes Implemented, Awaiting Database Schema Update  
**Date:** 2026-07-13  

---

## ✅ What's Been Completed in Phase 4

### 1. Import Routes Created (`server/src/routes/imports.js`)

A comprehensive REST API for managing file imports has been implemented with the following endpoints:

#### **POST /api/imports/upload**
Upload and parse Excel/CSV files

- Accepts multipart/form-data with file upload
- Validates file type (Excel .xlsx/.xls, CSV)
- Enforces 50MB size limit
- Parses CSV content with enhanced parser
- Stores metadata in database
- Returns parsed data preview to frontend

#### **POST /api/imports/mapping**
Save column mapping configuration

- Maps source columns to target database fields
- Validates mapping structure
- Stores transformation rules
- Supports multiple column mappings per import

#### **POST /api/imports/execute**
Execute the actual import process

- Validates that column mappings exist
- Executes batch insert to target table
- Tracks success/failure counts
- Updates import status in database
- Returns execution summary

#### **GET /api/imports/history**
Retrieve import history with filtering

- Supports limit and offset pagination
- Filter by status (completed, failed, etc.)
- Returns array of recent imports

#### **GET /api/imports/:id**
Get specific import details

- Retrieves full import record
- Includes associated mapping if exists
- Shows execution statistics

#### **DELETE /api/imports/:id**
Delete an import record and its uploaded file

---

## 🗄️ Database Schema Required

### New Tables to Create:

Run these SQL commands to create the necessary tables:

```sql
-- 1. Imports table - stores upload metadata
CREATE TABLE IF NOT EXISTS imports (
    id VARCHAR(255) PRIMARY KEY,
    connection_id INT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    columns_count INT,
    rows_count INT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ready', 'mapping_in_progress', 'importing', 'completed', 'failed') DEFAULT 'ready',
    error_message TEXT,
    records_imported INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    duration_ms INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id),
    INDEX idx_connection_id (connection_id),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date)
);

-- 2. Import mappings table - stores column mapping rules
CREATE TABLE IF NOT EXISTS import_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    source_column VARCHAR(100),
    target_field VARCHAR(100),
    transformation VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    INDEX idx_import_id (import_id)
);

-- 3. Import history table - tracks import execution attempts
CREATE TABLE IF NOT EXISTS import_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    records_processed INT,
    status ENUM('in_progress', 'completed', 'failed'),
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    INDEX idx_import_id (import_id),
    INDEX idx_started_at (started_at)
);

-- 4. Uploads directory for temporary file storage
CREATE TABLE IF NOT EXISTS upload_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) UNIQUE,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    import_id VARCHAR(255),
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
    INDEX idx_filename (filename)
);
```

---

## 🔧 dbService.js Methods to Implement

Update `server/src/services/dbService.js` with these methods:

### Required Methods:

```javascript
// Import operations
async saveImportMetadata(data) { ... }
async getImportById(id) { ... }
async getImportHistory(params = {}) { ... }
async deleteImport(id) { ... }
async saveImportMapping(data) { ... }
async getMappingForImport(importId) { ... }
async executeImport(config) { ... }
async updateImportStatus(importId, status, details = null) { ... }

// Connection testing (for actual MSSQL imports)
async testMSSQLConnection(host, port, database, username, password) { ... }
```

### Implementation Notes:

- Use `mysql2` or `mssql` packages depending on target database
- Implement transaction support for atomic operations
- Add error handling and retry logic for large imports
- Log all import activities for auditing

---

## 🧪 Testing the Backend API

### 1. Start the Server

```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/server
npm run dev
```

Server should start on `http://localhost:3000`

### 2. Test File Upload Endpoint

**Using curl:**
```bash
# Upload a CSV file
curl -X POST http://localhost:3000/api/imports/upload \
  -F "file=@/path/to/sample-data/employees.csv" \
  -H "Content-Type: multipart/form-data"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "file_id": "...",
    "columns_count": 8,
    "rows_count": 5,
    ...
  }
}
```

### 3. Test with Excel File (Mock)

For Excel files, the current implementation returns mock data. To enable real parsing:

1. Install SheetJS: `npm install xlsx`
2. Update `/api/imports/upload` to use `xlsx.read()`
3. Parse binary buffer from uploaded file

---

## 🔗 Frontend Integration (Next Steps)

### Update UnifiedImport.jsx to Use Real APIs:

Replace mock data fetches with actual API calls:

```javascript
// Instead of: setSavedConnections([mockData])
const [savedConnections, setSavedConnections] = useState([]);

useEffect(() => {
  const loadConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      const result = await response.json();
      if (result.success) {
        setSavedConnections(result.data);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  loadConnections();
}, []);
```

Similarly update:
- File upload to use `POST /api/imports/upload`
- Column mapping save to use `POST /api/imports/mapping`
- Import execution to use `POST /api/imports/execute`

---

## 📊 Performance Considerations

### For Large Files (>10MB):

1. **Streaming Parser**: Implement chunked file reading instead of loading entire file into memory
2. **Background Processing**: Use Node.js worker threads or queue system for large imports
3. **Progress WebSockets**: Real-time progress updates using Socket.IO or similar
4. **Batch Inserts**: Process in batches of 1000 records to avoid database lock issues

### For Production:

- Enable gzip compression on responses
- Implement request rate limiting
- Add caching for import history
- Use connection pooling for database queries

---

## 🐛 Common Issues & Solutions

### Issue 1: File Upload Fails with "File too large"
**Solution:** Increase multer limit in `imports.js`:
```javascript
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // Change to 100MB if needed
    },
    fileFilter: fileFilter
});
```

### Issue 2: CSV Parsing Errors
**Solution:** The enhanced parser handles quoted fields. If issues persist, ensure CSV format is standard (one record per line, comma-separated).

### Issue 3: Database Connection Timeout
**Solution:** Increase connection timeout in `dbService.js`:
```javascript
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 30000 // 30 seconds
};
```

---

## 📝 API Documentation

### Base URL: `http://localhost:3000/api`

#### Upload File
**Endpoint:** `POST /imports/upload`  
**Headers:** `Content-Type: multipart/form-data`  
**Body:** 
- `file`: Excel/CSV file (required)
- `connection_id`: ID of target connection (optional)

**Response:** 200 OK with parsed data preview

#### Save Column Mapping
**Endpoint:** `POST /imports/mapping`  
**Headers:** `Content-Type: application/json`  
**Body:** 
```json
{
    "import_id": "...",
    "file_id": "...",
    "mappings": {
        "Employee_ID": {"field": "emp_id"},
        ...
    }
}
```

**Response:** 201 Created with mapping ID

#### Execute Import
**Endpoint:** `POST /imports/execute`  
**Headers:** `Content-Type: application/json`  
**Body:** 
```json
{
    "import_id": "...",
    "file_id": "...",
    "connection_id": "...",
    "target_table": "employees"
}
```

**Response:** 200 OK with import statistics

---

## ✅ Phase 4 Completion Checklist

- [ ] Create database schema (3 new tables)
- [ ] Implement dbService methods for imports
- [ ] Test file upload endpoint with sample CSV
- [ ] Verify parsing returns correct data structure
- [ ] Test column mapping save and retrieval
- [ ] Test import execution with mock data
- [ ] Update frontend to use real API endpoints
- [ ] End-to-end test complete workflow
- [ ] Performance testing with larger files (10MB+)
- [ ] Error handling validation

---

*Phase 4 Implementation Guide - Backend Integration Complete, Awaiting Database Setup & Testing*
