# 🧪 Excel Importer - Testing Checklist & Validation Guide

Complete testing guide for verifying all features work correctly before deployment.

---

## ✅ Pre-Testing Setup

### 1. Verify Environment

```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/server

# Check Node version (need v18+)
node --version

# Check if dependencies installed
npm list | head -20

# Start server in background
npm run dev &
echo "Server PID: $!"

# Wait for server to start
sleep 3

# Verify server is running
curl http://localhost:3000/api/imports/history
```

**Expected:** Should return JSON with empty array or import records

### 2. Database Verification

```bash
# Check MySQL is accessible
sudo mysql -u root -e "SHOW PROCESSLIST;" | head -5

# Verify database exists
sudo mysql -u root -e "SHOW DATABASES LIKE 'excel_importer_db';"

# List all tables
sudo mysql -u root excel_importer_db -e "SHOW TABLES;"

# Check table structures
mysql -u root excel_importer_db -e "DESCRIBE imports; DESCRIBE column_mappings; DESCRIBE import_history;"
```

**Expected:** All 8 tables present with correct schema

### 3. Test MSSQL Connection (If Available)

```bash
# Test connection from server container
cd js-rebuild/server
docker run --rm -e MSSQL_SERVER=localhost \
  -e MSSQL_DATABASE=tempdb \
  -e MSSQL_USER=sa \
  mcr.microsoft.com/mssql/server /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P '' -Q "SELECT @@VERSION"
```

---

## 📋 Feature Testing Checklist

### 🔹 File Upload & Parsing

#### Test Cases:

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | Upload valid .xlsx file (small, <1MB) | ✅ Parses correctly, shows columns and preview | ⬜ |
| 2 | Upload valid .csv file | ✅ Parses correctly with proper CSV handling | ⬜ |
| 3 | Upload invalid file type (.txt, .pdf) | ❌ Returns 400 error: "Invalid file type" | ⬜ |
| 4 | Upload oversized file (>50MB) | ❌ Returns 400 error: "File too large" | ⬜ |
| 5 | Upload empty Excel file | ❌ Returns error: "No sheets found" | ⬜ |
| 6 | Upload corrupted Excel file | ❌ Returns parsing error with details | ⬜ |
| 7 | Upload .xlsx with multiple sheets | ✅ Uses first sheet only (document behavior) | ⬜ |

#### Manual Testing Steps:

```bash
# Create test CSV
cat > /tmp/test_employees.csv << 'EOF'
Employee_ID,Full_Name,Department,Email,Hire_Date
1,John Smith,Sales,john@example.com,2023-01-15
2,Jane Doe,Engineering,jane@example.com,2023-02-20
3,Bob Johnson,Marketing,bob@example.com,2023-03-10
4,Alice Williams,HR,alice@example.com,2023-04-05
EOF

# Test via curl (without UI)
curl -X POST http://localhost:3000/api/imports/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/tmp/test_employees.csv" \
  -F "connection_id=1"

# Expected response should include:
# - columns_count: 5
# - rows_count: 4
# - column_names array
# - sample_rows (first 3)
```

#### Automated Test Script:
See `test_imports_api.js` for automated API testing.

---

### 🔹 Column Mapping Interface

#### Test Cases:

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | Map all columns to target table | ✅ Saves successfully, returns mapping_id | ⬜ |
| 2 | Skip some columns (mark as skip) | ✅ Skipped columns not included in import | ⬜ |
| 3 | Use auto-fill button for target column | ✅ Converts to snake_case format | ⬜ |
| 4 | Save mapping without any mappings | ❌ Validation error: "Please map at least one column" | ⬜ |
| 5 | Update existing mappings | ✅ Previous mappings replaced with new ones | ⬜ |

#### Manual Testing Steps:

1. Upload test file (from above)
2. Click "Continue to Column Mapping"
3. Verify UI shows all detected columns
4. Test auto-fill button on each column
5. Mark 1-2 columns as "Skip"
6. Save mappings and check database:
   ```bash
   sudo mysql -u root excel_importer_db \
     -e "SELECT * FROM column_mappings WHERE import_id = 'YOUR_IMPORT_ID';"
   ```

---

### 🔹 Import Execution

#### Test Cases:

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | Execute insert mode with new data | ✅ Inserts all rows, returns count | ⬜ |
| 2 | Execute update mode without match key | ❌ Validation error or skips update logic | ⬜ |
| 3 | Execute update mode with valid match key | ✅ Updates existing records by match key | ⬜ |
| 4 | Import data that doesn't exist in target table | ✅ Creates table if using "create_table" mode (future) | ⬜ |
| 5 | Import very large file (10K+ rows) | ✅ Processes in batches, shows progress | ⬜ |

#### Manual Testing Steps:

```bash
# Create test data in target table first
sudo mysql -u root excel_importer_db \
  -e "CREATE TABLE IF NOT EXISTS test_employees (
    Employee_ID INT PRIMARY KEY, 
    Full_Name VARCHAR(255), 
    Department VARCHAR(100), 
    Email VARCHAR(255), 
    Hire_Date DATE
  );"

# Test insert mode via API
curl -X POST http://localhost:3000/api/imports/execute \
  -H "Content-Type: application/json" \
  -d '{
    "import_id": "YOUR_IMPORT_ID",
    "mode": "insert",
    "mappings": {
      "Employee_ID": {"field": "Employee_ID"},
      "Full_Name": {"field": "Full_Name"},
      ...
    },
    "rows_count": 4
  }'

# Verify in database
sudo mysql -u root excel_importer_db \
  -e "SELECT * FROM test_employees ORDER BY Employee_ID;"
```

---

### 🔹 Import History & Management

#### Test Cases:

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | View import history (no filters) | ✅ Shows all imports with pagination | ⬜ |
| 2 | Filter by status = completed | ✅ Only shows completed imports | ⬜ |
| 3 | Filter by status = failed | ✅ Only shows failed imports | ⬜ |
| 4 | Delete import record | ✅ Removes from database, cascades to related tables | ⬜ |
| 5 | View specific import details | ✅ Shows full metadata + mappings | ⬜ |

#### Manual Testing Steps:

```bash
# Test history API with filters
curl "http://localhost:3000/api/imports/history?status=completed&limit=5"

# Delete an old test record
curl -X DELETE http://localhost:3000/api/imports/YOUR_TEST_ID

# Verify deletion
sudo mysql -u root excel_importer_db \
  -e "SELECT * FROM imports WHERE id = 'YOUR_TEST_ID';" 
  # Should return empty result
```

---

## 🌐 Frontend UI Testing

### Visual & Usability Tests:

| Component | Test Focus | Expected Behavior | Status |
|-----------|------------|-------------------|--------|
| **File Upload** | Drag-drop, file validation | Shows preview after upload | ⬜ |
| **Column Mapper** | Auto-fill button, skip toggle | Clean mapping interface | ⬜ |
| **Import Progress** | Mode selection, progress bar | Clear status updates during import | ⬜ |
| **Results Page** | Success/error messages | Detailed statistics shown | ⬜ |
| **Toast Notifications** | Error/success alerts | Non-intrusive bottom-right toasts | ⬜ |
| **Connection Manager** (if implemented) | Add/edit/delete connections | Form validation works | ⬜ |

### Browser Compatibility:

- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest)
- [ ] Safari (if macOS available)

---

## 🔒 Security Testing

| Test | Description | Expected Result | Status |
|------|-------------|-----------------|--------|
| SQL Injection | Try `' OR '1'='1` in file names | ❌ Input sanitized, no query executed | ⬜ |
| XSS Attack | `<script>alert('xss')</script>` in columns | ❌ Output escaped, script doesn't run | ⬜ |
| File Type Bypass | Rename .exe to .xlsx and upload | ❌ MIME type check catches it | ⬜ |
| Path Traversal | Upload file named `../../malicious.xlsx` | ✅ Filename sanitized, no path traversal | ⬜ |

---

## 📊 Performance Testing

### Load Tests:

| Metric | Target Value | Actual Result | Status |
|--------|--------------|---------------|--------|
| Small file (<1K rows) upload time | < 3 seconds | ___ sec | ⬜ |
| Large file (10K rows) import time | < 30 seconds | ___ sec | ⬜ |
| Concurrent uploads (2 users) | No timeouts or errors | ✓ Passed / ✗ Failed | ⬜ |

### Tools:

```bash
# Test with Apache Bench (if available)
ab -n 100 -c 10 -p test_request.json http://localhost:3000/api/imports/upload

# Monitor database performance during tests
sudo mysql -u root excel_importer_db \
  -e "SHOW PROCESSLIST;" while true; do sleep 5; done &
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Server won't start
**Symptoms:** `Error: listen EADDRINUSE`  
**Solution:** Another instance is running. Kill it:
```bash
lsof -ti :3000 | xargs kill -9
```

### Issue 2: Database connection refused
**Symptoms:** `Error: connect ECONNREFUSED 127.0.0.1:3306`  
**Solution:** 
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env` match actual database user

### Issue 3: Files not uploading
**Symptoms:** Upload shows "Processing..." forever  
**Solution:**
- Check server logs for multer errors
- Verify `uploads/` directory exists and is writable
- Check file size isn't exceeding limit

### Issue 4: Import executes but no data appears
**Symptoms:** API returns success, database empty  
**Solution:**
- Verify target table exists
- Check column mappings are correct
- Look at import_logs table for row-level errors

---

## 📝 Test Report Template

```markdown
# Test Report - Excel Importer

**Test Date:** 2026-XX-XX  
**Tester:** [Your Name]  
**Environment:** Linux, Node v18.x, MySQL 8.0, Browser: Chrome

### Overall Status: ⬜ PASS / ⬜ FAIL / ⬜ PARTIAL

## Critical Issues Found
1. 
2. 

## Minor Issues Found
1. 
2. 

## Features Tested
- [ ] File Upload - ✅/❌
- [ ] Column Mapping - ✅/❌
- [ ] Import Execution - ✅/❌
- [ ] History Management - ✅/❌

## Performance Notes
- Upload times: ___ sec (small), ___ sec (large)
- Concurrent users tested: ___
- Database load during import: ___ queries/sec

## Recommendations
1. 
2. 

### Sign-off
Tester signature: _________________________
Date: _______________
```

---

*Last Updated: 2026-07-14 | Use this checklist before morning testing session!* ✅
