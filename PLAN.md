# Excel to MSSQL Importer - Project Plan

## Architecture
- **Local:** Docker container runs Laravel app + MySQL (for app data only)
- **Remote:** File imports go directly to user-provided MSSQL server (no data copied locally)

## Tech Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Laravel 11 (PHP) | API endpoints, file processing, session management |
| Local DB | MySQL 8.0 (Docker) | Stores app metadata: import jobs, user configs, logs |
| Remote DB | MSSQL Server 2018+ | Target for file imports (user-provided credentials only) |
| Frontend | React 18 + Bootstrap 5 | Interactive UI for mapping & configuration |
| Excel Parsing | phoffice/phpspreadsheet | Read/uploaded Excel files |

## Core Features

### 1. Remote MSSQL Connection
- Users input: Server name, Database name, Windows username/password
- Uses `trusted_connection=yes` with explicit SQL auth credentials
- Connection test before allowing operations

### 2. File Upload & Parsing
- Laravel handles `.xlsx`, `.xls`, `.csv` uploads (max ~100KB for 50K rows)
- Use `PhpOffice/PhpSpreadsheet` or `maatwebsite/excel` for parsing
- Extract column headers and preview data

### 3. Column Mapping UI
- React component: Drag Excel columns → Select MSSQL target column
- Show column types hint (text, number, date) from Excel
- Option to skip unmapped columns

### 4. Import Modes
- **Insert:** Add new rows only
- **Update:** Match on specified key column, update existing rows
- **Create Table (Optional):** Auto-create table structure if not exists

### 5. Batch Processing
- Process in batches of 1000-5000 rows for 50K files
- Progress indicator during import
- Error handling: skip invalid rows, log errors

## Project Structure

```
excel-importer/
├── docker-compose.yml          # Laravel container + Local MySQL
├── backend/                    # Laravel 11 application
│   ├── app/Http/Controllers/API/
│   │   ├── ConnectionController.php    # Test MSSQL connection
│   │   ├── UploadController.php        # File upload & parse
│   │   ├── MappingController.php       # Save/load column mappings
│   │   └── ImportController.php        # Execute import to remote MSSQL
│   ├── app/Models/
│   │   ├── Job.php                    # Import job metadata (local MySQL)
│   │   └── MappingConfig.php          # Column mapping storage
│   ├── routes/api.php                # REST API endpoints
│   ├── config/database.php           # Local MySQL + MSSQL connection helper
│   └── .env                          # LOCAL DB credentials + app config
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectionConfig.jsx   # Remote MSSQL server settings
│   │   │   ├── FileUpload.jsx         # Upload + preview columns
│   │   │   ├── ColumnMapper.jsx       # Drag-drop mapping UI
│   │   │   └── ImportProgress.jsx     # Progress bar + results
│   │   ├── services/api.js            # Axios config for Laravel API
│   │   └── App.jsx                    # Main application
├── .dockerignore
├── README.md                        # Setup instructions
└── requirements.txt                  # PHP extensions needed
```

## User Flow

1. **Start App** → Docker container launches with Laravel + Local MySQL
2. **Configure Remote MSSQL** → Enter server name, DB name, Windows user/password
3. **Test Connection** → Verify app can reach remote MSSQL
4. **Upload Excel File** → Select file (max ~500KB for 50K rows)
5. **Map Columns** → Visual mapping: Excel columns → Remote table columns
6. **Choose Mode:** Insert / Update (select match key) / Create Table
7. **Execute Import** → Batch processing with progress indicator
8. **View Results** → Rows inserted/updated, errors logged

## Database Roles

| Database | Purpose | Data Stored |
|----------|---------|-------------|
| Local MySQL (Docker) | App metadata | Import jobs history, column mappings, user configs, error logs |
| Remote MSSQL (User-provided) | File imports | Only the actual Excel data being imported - nothing else |

## Docker Setup

```yaml
version: '3.8'
services:
  app:
    build: ./backend
    ports:
      - "8000:80"
    environment:
      - DB_CONNECTION=mysql
      - DB_HOST=mysql
      - DB_DATABASE=excel_importer_db
      - MSSQL_SERVER=localhost
    volumes:
      - ./backend/storage/app/uploads:/var/www/html/storage/app/uploads
      - ./backend/storage/logs:/var/www/html/storage/logs
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: excel_importer_db
      MYSQL_USER: sail
      MYSQL_PASSWORD: ***
      MYSQL_ROOT_PASSWORD: ***
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## Key Packages

**Backend:**
- `phpoffice/phpspreadsheet` (Excel parsing)
- `laravel/framework` (Laravel core)

**Frontend:**
- React 18
- Bootstrap 5
- Axios (API calls)

## Important Considerations

1. **File Size Limits:** Laravel default: 2MB upload max → increase in `.env`
2. **Remote MSSQL Connection:** Uses Windows Authentication + explicit SQL login
3. **Performance:** Batch size: 1000-5000 rows per batch for 50K files
4. **Security:** Remote MSSQL credentials stored in `.env` (never in frontend)
5. **Files auto-delete** after processing from local storage

## Development Timeline

| Day | Tasks |
|-----|-------|
| Day 1 | Laravel setup, Docker compose, local MySQL, MSSQL connection test endpoint |
| Day 2 | React app: Connection config UI + File upload with preview |
| Day 3 | Column mapping component + API endpoints for save/load mappings |
| Day 4 | Import execution engine (insert/update) with batch processing |
| Day 5 | Progress tracking, error handling, testing on remote MSSQL |

## Summary

- **Local:** Laravel + MySQL (Docker) = app brain (stores jobs/configs)
- **Remote:** User's MSSQL = only place where Excel data lives after import
- **Files never touch local disk permanently** → auto-delete after processing
- **Ready to test immediately** on your existing remote MSSQL instance
