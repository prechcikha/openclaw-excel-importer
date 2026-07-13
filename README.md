# 📊 Excel to MSSQL Importer

[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)](https://github.com/prechcikha/openclaw-excel-importer)  
[![Phase](https://img.shields.io/badge/phase-Phase%204%20in%20Progress-blue.svg)]()  
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

**A web application for importing Excel files into remote Microsoft SQL Server databases with flexible column mapping and batch processing.**

---

## 🎯 Overview

This OpenClaw project provides a powerful, user-friendly web interface for uploading Excel/CSV files and importing data into your own MSSQL server. Perfect for businesses needing to migrate data from spreadsheets to enterprise database systems securely and efficiently.

**Current Status:** Phase 4 - Backend API Implementation (In Progress)

---

## ✨ Key Features

### 📤 File Upload & Parsing
- **Multiple Formats:** Support for `.xlsx`, `.xls`, and `.csv` files
- **Large File Handling:** Batch processing up to 50K+ rows with progress tracking
- **File Size Limits:** Configurable upload limits (default: 50MB)
- **Automatic Detection:** Smart parsing of column structures

### 🔗 Remote MSSQL Integration
- **Secure Connection:** User-provided credentials stored server-side only
- **Multiple Auth Methods:** Windows Authentication or SQL Login support
- **Flexible Server Config:** Works with Azure SQL, SQL Express, and remote servers

### 📊 Visual Column Mapping Interface
- **Drag-and-Drop Mapping:** Map Excel columns to database fields visually
- **Transform Rules:** Apply transformations per column (formatting, calculations)
- **Save Mappings:** Persist mappings for reuse across imports

### 💾 Import Modes
1. **Insert New Records:** Append data without duplicates
2. **Update Existing:** Update records by matching key fields
3. **Create Table:** Automatically create database tables from schema

### 📈 Progress Tracking & Error Handling
- Real-time import progress monitoring
- Detailed error reporting with row-level failure tracking
- Import history and audit logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│                   ┌──────────────┐                          │
│                   │   React UI   │  ← Glass UI, Bootstrap 5 │
│                   └──────┬───────┘                          │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST API
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend Server (Laravel 11)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Controllers│  │     Routes   │  │ Middleware   │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │   Models     │  │    API       │  │  Validation  │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
└─────────┼───────────────────────────────────────────────────┘
          │ Docker Compose (Local Environment)
┌─────────▼───────────────────────────────────────────────────┐
│              Local Database (MySQL 8.0)                      │
│           Stores app metadata, configs, import jobs         │
└─────────────────────────────────────────────────────────────┘
                           │ Secure Connection
┌──────────────────────────▼──────────────────────────────────┐
│            Remote MSSQL Server (User's Infrastructure)       │
│             ONLY LOCATION WHERE ACTUAL DATA IS IMPORTED      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Laravel 11 (PHP) | Server-side logic, API endpoints |
| **Frontend** | React 18 + Bootstrap 5 | User interface with glass UI design |
| **Local DB** | MySQL 8.0 (Docker) | Application metadata & job tracking |
| **Remote DB** | MSSQL Server 2018+ | Target data destination |
| **Excel Parsing** | PhpOffice/PhpSpreadsheet | Read Excel/CSV files |
| **File Upload** | Multer | Handle multipart file uploads |
| **Containerization** | Docker & Docker Compose | Easy local development setup |

---

## 📦 Project Structure

```
excel-importer/
├── backend/                    # Laravel application core
│   ├── app/
│   │   ├── Controllers/       # Import controllers
│   │   ├── Models/            # Database models
│   │   └── Services/          # Import service logic
│   ├── routes/api.php         # REST API endpoints
│   ├── Dockerfile             # PHP-FPM container config
│   └── composer.json          # PHP dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # UI components (UnifiedImport, etc.)
│   │   ├── pages/             # Main pages
│   │   ├── services/          # API client services
│   │   └── App.jsx            # Root component
│   └── package.json           # Node dependencies
├── js-rebuild/                 # JavaScript-based rebuild version
│   └── server/                 # Node.js/Express API server
│       ├── src/routes/imports.js    # Import management APIs ✅
│       └── server.js               # Express server entry point
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment variables template
├── README.md                   # This file
└── MEMORY*.md                  # Development progress logs
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Remote MSSQL server accessible from your network
- Git (for cloning)

### Installation Steps

#### 1. Clone Repository
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer
docker-compose up -d
```

#### 2. Generate Application Key
```bash
cd backend
php artisan key:generate
```

#### 3. Configure Environment
Edit `.env` file with your settings:
```bash
APP_NAME=Excel Importer
DB_CONNECTION=mysql
DB_HOST=mysql
MSSQL_SERVER=<your-mssql-server>
MSSQL_DATABASE=<target-database>
```

#### 4. Run Migrations
```bash
docker-compose exec app php artisan migrate
```

#### 5. Access Application
Open http://localhost:8000 in your browser

---

## 🔌 API Endpoints (Phase 4)

### File Upload
```http
POST /api/imports/upload
Content-Type: multipart/form-data

Body: file=<Excel or CSV file>
```
**Response:** Parsed data preview with column names and row count

### Column Mapping
```http
POST /api/imports/mapping
{
  "import_id": "uuid",
  "mappings": {
    "Employee_ID": {"field": "emp_id", "transform": null}
  }
}
```

### Execute Import
```http
POST /api/imports/execute
{
  "import_id": "uuid",
  "mode": "insert|update|create_table"
}
```

**Full API documentation:** See `HEARTBEAT.md` for Phase 4 implementation details.

---

## 🧪 Testing

### Run Test Suite
```bash
cd backend
php artisan test

# Or JavaScript version
cd js-rebuild/server
npm run test
```

### Manual Testing Checklist
- [ ] Upload sample CSV file (10K+ rows)
- [ ] Map columns correctly
- [ ] Verify import to MSSQL server
- [ ] Check error handling for invalid data
- [ ] Test all three import modes

---

## 🔐 Security Features

✅ **Credentials Never Exposed:** Remote MSSQL credentials stored only on server  
✅ **Secure File Processing:** Files processed in isolated containers  
✅ **Auto-Cleanup:** Uploaded files auto-delete after successful processing  
✅ **Input Validation:** All user inputs sanitized and validated  
✅ **Rate Limiting:** Prevents abuse of import endpoints  

---

## 📊 Current Development Status

### ✅ Completed Phases
- **Phase 1:** Project setup & architecture design
- **Phase 2:** Backend API implementation (routes, controllers)
- **Phase 3:** Frontend UI with glass design + testing
- **Testing:** Comprehensive test coverage achieved

### 🚧 In Progress: Phase 4 - Backend Integration
- [x] All import API routes implemented
- [ ] Database schema updates needed
- [ ] dbService methods for imports
- [ ] Endpoints tested with sample data
- [ ] Frontend connected to real APIs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤖 About OpenClaw

This project was created as part of the **OpenClaw** AI assistant workspace, designed to help automate complex workflows and data management tasks with intelligent agent assistance.

**Repository:** https://github.com/prechcikha/openclaw-excel-importer  
**Project Location:** `/home/openclaw/.openclaw/workspace/excel-importer`  

---

*Last Updated: 2026-07-13 | Phase 4 in Progress*  
*GitHub Integration: Enabled ✅ | Auto-commit: Ready 🚀*
