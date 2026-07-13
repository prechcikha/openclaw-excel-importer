# 🚀 Excel Importer - Quick Start Guide

A powerful web application for importing Excel files into Microsoft SQL Server databases with flexible column mapping and batch processing.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js** v18+ 
- ✅ **MySQL** server running
- ✅ **Docker & Docker Compose** (for local development)
- ✅ **Git**
- ✅ A remote MSSQL server (optional for testing)

---

## 🏗️ Project Structure

```
excel-importer/
├── backend/              # Laravel 11 PHP version (not currently used)
├── frontend/             # React + Bootstrap 5 UI
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── utils/        # Helper utilities (toast notifications, etc.)
│       └── api.js        # API client with all endpoints
├── js-rebuild/           # Node.js/Express version ← PRIMARY VERSION
│   └── server/
│       ├── src/
│       │   ├── routes/   # API route handlers
│       │   └── services/ # Business logic & database access
│       ├── database/     # SQL schemas
│       └── uploads/      # Temporary file storage
├── memory/               # Development logs
└── scripts/              # Automation scripts
```

---

## 🚦 Quick Start (5 Minutes)

### 1️⃣ Install Dependencies

```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/server
npm install
```

### 2️⃣ Configure Database

Edit `.env` file:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=excel_importer_db
```

Create and migrate the database:
```bash
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS excel_importer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

node setup-database.js
```

### 3️⃣ Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`  
API available at `http://localhost:3000/api/imports`

### 4️⃣ Open the Application

Open your browser to: **http://localhost:3000**

---

## 📤 How to Use

### Step 1: Upload a File

1. Click "Upload Excel File" or navigate to `/upload`
2. Select an `.xlsx`, `.xls`, or `.csv` file (max 50MB)
3. The system will automatically parse the file and show:
   - Column names detected
   - First few rows as preview
   - Total row count

### Step 2: Map Columns

1. Click "Continue to Column Mapping"
2. Enter your **Target Table Name** in MSSQL (e.g., `employees`, `customers`)
3. For each Excel column, specify the **Database Column** name
   - Tip: Use the ↪️ button to auto-fill with snake_case version
4. Mark columns as "Skip" if you don't want them imported
5. Click "Next: Import Mode"

### Step 3: Choose Import Mode

1. Select your import mode:
   - **Insert** - Add new records only (no duplicates)
   - **Update** - Update existing records by match key
   - **Upsert** - Insert or update based on what exists
2. For "Update" mode, select a **Match Key Column** (e.g., Employee_ID)
3. Review the data preview and mappings
4. Click "Execute Import"

### Step 4: Monitor Progress & View Results

- The import runs automatically with progress tracking
- Once complete, view detailed results:
  - Total rows processed
  - Successfully imported count
  - Failed rows (if any)
  - Duration in seconds

---

## 🔌 API Reference

All endpoints are documented below. Use tools like **Postman**, **curl**, or the browser dev tools to test.

### Base URL: `http://localhost:3000/api/imports`

#### 📤 Upload File

```bash
POST /api/imports/upload
Content-Type: multipart/form-data

file: [Excel/CSV file]
connection_id: 1 (optional, default test connection)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file_id": "auto-generated-id",
    "file_name": "employees.csv",
    "columns_count": 8,
    "rows_count": 1500,
    "column_names": ["Employee_ID", "Full_Name", ...],
    "sample_rows": [...]
  }
}
```

#### 🗺️ Save Column Mapping

```bash
POST /api/imports/mapping
Content-Type: application/json

{
  "import_id": "<from upload response>",
  "mappings": {
    "Employee_ID": {"field": "emp_id", "transform": null},
    "Full_Name": {"field": "full_name", "transform": null}
  }
}
```

#### ▶️ Execute Import

```bash
POST /api/imports/execute
Content-Type: application/json

{
  "import_id": "<from upload response>",
  "mode": "insert|update|upsert",
  "mappings": [...],
  "rows_count": 1500,
  "match_key_column": "Employee_ID" (optional, for update mode)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records_total": 1500,
    "records_imported": 1500,
    "records_failed": 0,
    "duration_ms": 234
  }
}
```

#### 📜 Get Import History

```bash
GET /api/imports/history?limit=10&offset=0&status=ready
```

#### 🔍 Get Specific Import Details

```bash
GET /api/imports/:id
```

#### 🗑️ Delete Import Record

```bash
DELETE /api/imports/:id
```

---

## 🧪 Testing with Sample Data

### Create a Test CSV File

Create `test_employees.csv`:
```csv
Employee_ID,Full_Name,Department,Email,Hire_Date
1,John Smith,Sales,john.smith@example.com,2023-01-15
2,Jane Doe,Engineering,jane.doe@example.com,2023-02-20
3,Bob Johnson,Marketing,bob.j@example.com,2023-03-10
```

### Upload and Import

1. Upload `test_employees.csv` through the UI or API
2. Map columns to a target table (e.g., `test_employees`)
3. Execute import with mode "insert"

Verify in MySQL:
```bash
sudo mysql -u root excel_importer_db -e "SELECT * FROM test_employees;"
```

---

## 🔐 Security Features

- ✅ **File Size Limits**: 50MB maximum (configurable via `MAX_FILE_SIZE` env var)
- ✅ **Input Validation**: All user inputs sanitized
- ✅ **Secure File Processing**: Files processed in isolated manner
- ✅ **Credentials Stored Server-Side Only**: Not exposed to frontend
- ⚠️ **Production Ready**: Encrypt MSSQL passwords before storage

---

## 🛠️ Development Workflow

### Running Both Versions

**Node.js Version (Recommended for development):**
```bash
cd js-rebuild/server && npm run dev
```

**Laravel Version (For legacy code reference):**
```bash
cd backend && php artisan serve --host=0.0.0.0 --port=8000
```

### Debugging Tips

1. **Check server logs:**
   ```bash
   tail -f js-rebuild/server/uploads/*  # View uploaded files
   tail -f /var/log/mysql/error.log     # MySQL errors
   ```

2. **Test database connection:**
   ```bash
   sudo mysql -u root excel_importer_db -e "SHOW TABLES;"
   ```

3. **View API requests in browser:**
   - Open DevTools → Network tab
   - Filter by `/api/imports` to see import requests

---

## 📊 Import Modes Explained

### Insert Mode
- Adds all rows as new records
- No duplicates allowed (INSERT IGNORE or ON DUPLICATE KEY UPDATE)
- Best for: Initial data loads, adding new employees/customers

### Update Mode  
- Finds existing records by match key and updates them
- Requires selecting a unique identifier column
- Best for: Syncing with external systems, updating employee info

### Upsert Mode (Future Enhancement)
- Inserts new records AND updates existing ones
- Uses match key to determine which action to take
- Best for: Merging data from multiple sources

---

## 🐛 Troubleshooting

### "File too large" Error
- **Issue**: File exceeds 50MB limit
- **Solution**: Split file into smaller chunks or increase `MAX_FILE_SIZE` in `.env`

### "Failed to parse Excel file"
- **Cause**: Corrupted Excel file or unsupported format
- **Fix**: Try re-exporting from Excel with "CSV (Comma delimited)" option

### "Connection test failed"
- **Check**: 
  - MSSQL server is running and accessible
  - Correct hostname, port, credentials
  - Firewall isn't blocking port 1433

### Import shows as "Completed" but no data in database
- **Issue**: Mock simulation mode active
- **Fix**: Ensure real MSSQL connection details are configured in `.env`

---

## 📈 Performance Considerations

- **Large Files (10K+ rows)**: Uses batch processing (100 rows/batch)
- **Memory Usage**: Files streamed, not loaded entirely into memory
- **Database Load**: Transactions ensure data integrity during imports

### Optimizing Large Imports

For files with 50K+ rows:
1. Split into smaller chunks in Excel before upload
2. Increase batch size in `dbService.js` (currently 100)
3. Use "insert" mode for better performance than update

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with clear messages
4. Push to the branch and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤖 About OpenClaw

This project was created as part of the **OpenClaw** AI assistant workspace, designed to help automate complex workflows and data management tasks with intelligent agent assistance.

**Project Location:** `/home/openclaw/.openclaw/workspace/excel-importer`  
**GitHub Repository:** https://github.com/prechcikha/openclaw-excel-importer  

---

*Last Updated: 2026-07-14 | Phase 4 Complete - Ready for Testing!* ✅
