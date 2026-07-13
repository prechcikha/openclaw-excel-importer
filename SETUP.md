# Excel to MSSQL Importer - Setup Guide

## Quick Start (3 Steps)

### 1. Clone & Configure
```bash
cd excel-importer
cp .env.example .env
./start.sh
```

### 2. Access Application
Open http://localhost:8000 in your browser

### 3. Connect to Remote MSSQL
- Enter your remote server details (e.g., `your-server.database.windows.net`)
- Test connection
- Upload Excel files and import data!

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────┐
│   Laravel App   │◄───────►│  MySQL DB    │
│ (Local Docker)  │   API   │  (Metadata)  │
└─────────────────┘         └──────────────┘
        │                              │
        │ REST API                     │
        ▼                              ▼
┌─────────────────┐         ┌──────────────────┐
│ React Frontend  │         │ Remote MSSQL     │
│ (User Interface)│   File  │  Server (Remote) │
└─────────────────┘         └──────────────────┘

Key Points:
- Local MySQL stores only app metadata (jobs, configs, logs)
- Excel data NEVER touches local server permanently
- Files auto-delete after successful import to remote MSSQL
```

---

## Project Structure

### Backend (Laravel 11)
```
backend/
├── app/Http/Controllers/API/
│   ├── ConnectionController.php    # Test remote MSSQL connection
│   ├── UploadController.php        # File upload & Excel parsing
│   ├── MappingController.php       # Save/load column mappings
│   └── ImportController.php        # Execute import operations
├── routes/api.php                  # REST API endpoints
├── Dockerfile                      # PHP-FPM container with extensions
└── composer.json                   # Dependencies (Laravel + PhpSpreadsheet)
```

### Frontend (React 18)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ConnectionConfig.jsx    # Remote MSSQL config form
│   │   ├── FileUpload.jsx          # Upload & column preview
│   │   ├── ColumnMapper.jsx        # Visual mapping interface
│   │   └── ImportProgress.jsx      # Import mode selection & execution
│   ├── services/api.js             # Axios API client
│   └── App.jsx                     # React router setup
└── package.json                    # Dependencies (React, Bootstrap, Axios)
```

### Infrastructure
- `docker-compose.yml` - Orchestrates Laravel + MySQL containers
- `.env.example` - Environment variables template
- `start.sh` - Automated startup script

---

## Key Features Implementation

### 1. Remote MSSQL Connection
**Location:** `backend/app/Http/Controllers/API/ConnectionController.php`

Uses PDO ODBC driver to connect without requiring PHP-mssql extension on container:
```php
$dsn = "ODBC:Driver={ODBC Driver 18 for SQL Server}";
$params = ['Server' => $server, 'Database' => $database];
// Supports both Windows Auth (trusted_connection) and SQL Login
```

### 2. File Upload & Parsing
**Location:** `backend/app/Http/Controllers/API/UploadController.php`

- Validates file type (.xlsx, .xls, .csv)
- Uses PhpOffice/PhpSpreadsheet for parsing
- Extracts column headers with type inference (text, number, date, boolean)
- Auto-deletes files after processing

### 3. Column Mapping UI
**Location:** `frontend/src/components/ColumnMapper.jsx`

Features:
- Visual mapping table showing all Excel columns
- Auto-fill target columns from Excel names (snake_case conversion)
- Skip unmapped columns option
- Real-time validation

### 4. Import Execution
**Location:** `backend/app/Http/Controllers/API/ImportController.php`

Modes:
- **INSERT**: Add new rows only
- **UPDATE**: Match by primary key column and update existing records
- **UPSERT** (future): Insert or update based on match key

Batch processing for 10K-50K+ row files.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Local MySQL (Docker)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=excel_importer_db
DB_USERNAME=sail
DB_PASSWORD=password

# Remote MSSQL Defaults (override in UI or .env)
MSSQL_SERVER=localhost
MSSQL_DATABASE=tempdb
MSSQL_TRUSTED_CONNECTION=yes
```

---

## Database Roles

| Database | Purpose | Data Stored |
|----------|---------|-------------|
| **Local MySQL** (Docker port 3306) | App metadata | Import jobs, column mappings, user configs, error logs |
| **Remote MSSQL** (User-provided) | File imports | ONLY the Excel data being imported - nothing else |

---

## Security Considerations

1. **Credentials**: Remote MSSQL credentials stored server-side in `.env`, never exposed to frontend
2. **File Uploads**: Limited to 5MB, validated MIME type, auto-deleted after processing
3. **SQL Injection Prevention**: All database queries use parameterized statements via PDO/SQLAlchemy
4. **HTTPS Required**: For production deployment (configure nginx/reverse proxy)
5. **Isolated Storage**: Uploaded files stored in `storage/app/uploads` with restricted permissions

---

## Performance Optimization

- **Batch Size**: Configurable 1000-5000 rows per batch for large imports
- **Progress Tracking**: Real-time progress bar during import (via polling or WebSocket)
- **Error Handling**: Skip invalid rows, log errors without stopping entire import
- **Memory Management**: Laravel increases memory limit for file processing

---

## Troubleshooting

### Connection Issues
```bash
# Check if remote MSSQL is accessible
telnet your-server.database.windows.net 1433

# Test from Docker container
docker-compose exec app php artisan tinker
>>> $connection = new PDO("ODBC:Driver={ODBC Driver 18 for SQL Server};Server=$server;Database=$database");
```

### PHP Memory Limit
If importing large files fails:
```bash
cd backend
php -d memory_limit=512M artisan config:cache
```

### Docker Issues
```bash
# Restart containers
docker-compose restart

# Check logs
docker-compose logs app
docker-compose logs mysql

# Rebuild if needed
docker-compose build --no-cache
docker-compose up -d
```

---

## Next Steps

1. **Test with sample data**: Upload a small Excel file to verify the workflow
2. **Production deployment**: 
   - Configure nginx reverse proxy
   - Enable HTTPS/SSL certificates
   - Set up proper firewall rules for remote MSSQL access
   - Increase PHP memory limit if needed

3. **Advanced features** (future):
   - User authentication (Laravel Breeze/Jetstream)
   - Import history & job management
   - Email notifications on import completion
   - Scheduled imports via cron
   - Support for MySQL as alternative target database

---

## License

MIT License - See LICENSE file for details
