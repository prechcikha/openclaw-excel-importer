# Excel to MSSQL Importer - JavaScript/Node.js Rewrite (2026-07-12)

## 🎯 Project Goal
Replace PHP/Laravel backend with Node.js + Express for faster development, simpler deployment, and better compatibility.

---

## 📊 Why Switch to JavaScript?

| Aspect | PHP/Laravel | Node.js/Express |
|--------|-------------|-----------------|
| **Setup Time** | 2+ hours (Docker, Composer) | ~30 minutes (npm install) ✅ |
| **Dependencies** | Complex PHP extensions required | Standard npm packages ✅ |
| **Frontend Integration** | Separate React build needed | Single-page app, direct integration ✅ |
| **Deployment** | Docker containers | Any Node.js server or platform-as-a-service ✅ |
| **Development Speed** | Slower (compilation, dependencies) | Faster (instant feedback) ✅ |
| **MSSQL Connection** | Requires ODBC drivers + PECL extensions | Uses `mssql` npm package ✅ |

---

## 🏗️ New Architecture

```
excel-importer/
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/       # API endpoints (upload, import, etc.)
│   │   ├── services/          # Business logic (file parsing, DB operations)
│   │   ├── middleware/        # Auth, validation, error handling
│   │   └── app.js             # Express app initialization
│   ├── package.json           # Node dependencies
│   └── server.js              # Entry point
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── App.jsx            # Main app component
│   │   └── index.js           # Entry point
│   └── package.json           # React dependencies
├── docker-compose.yml         # Node + MySQL services (optional)
├── .env                       # Environment configuration
└── README.md                  # Project documentation
```

---

## 📦 Technology Stack

### Backend (Node.js/Express)
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js
- **MSSQL Driver**: `mssql` (tedious library)
- **Excel Parsing**: `xlsx` (SheetJS) or `exceljs`
- **Validation**: `express-validator`
- **File Upload**: `multer` + `busboy` for large files

### Frontend (React 18)
- **Framework**: React 18 + Vite (faster than Create React App)
- **UI Library**: Bootstrap 5 or Material-UI
- **State Management**: React Context API or Zustand (lightweight)
- **HTTP Client**: Axios
- **File Upload**: Dropzone or custom implementation

### Database
- **MySQL/MariaDB**: For metadata storage (imports, connections, settings)
- **MSSQL Server**: Target database for imports (remote connection)

---

## 🎯 Core Features to Implement

1. ✅ **Connection Management** - Store remote MSSQL server credentials securely
2. ✅ **File Upload** - Accept Excel (.xlsx, .xls) and CSV files up to 50MB
3. ✅ **Column Mapping** - Visual interface to map Excel columns → MSSQL table fields
4. ✅ **Import Execution** - INSERT/UPDATE modes with batch processing
5. ✅ **Progress Tracking** - Real-time progress bars for large imports
6. ✅ **Error Handling** - Detailed error messages and rollback support

---

## 🚀 Implementation Plan (Phased)

### Phase 1: Foundation (Today)
- [x] Set up Node.js project structure
- [x] Create Express server with basic endpoints
- [x] Install core dependencies (Express, mssql, xlsx)
- [ ] Configure MySQL/MariaDB for metadata storage
- [ ] Implement connection management API

### Phase 2: File Upload & Parsing
- [ ] Build file upload endpoint (multer middleware)
- [ ] Parse Excel files with SheetJS (`xlsx` library)
- [ ] Parse CSV files with native `csv-parse`
- [ ] Store parsed data temporarily in MySQL for import execution

### Phase 3: Column Mapping UI
- [ ] Create React components for connection configuration
- [ ] Build file upload preview component
- [ ] Implement column mapping interface (drag-drop or select)
- [ ] Save mappings to database

### Phase 4: Import Execution
- [ ] Execute SQL INSERT/UPDATE statements
- [ ] Handle batch processing (100 rows per transaction)
- [ ] Track progress and display in UI
- [ ] Implement rollback on failure

### Phase 5: Polish & Production Ready
- [ ] Add authentication (JWT or session-based)
- [ ] Add error handling middleware
- [ ] Write comprehensive documentation
- [ ] Set up Docker for easy deployment

---

## 📝 Key Technical Decisions

### Why Node.js?
1. **Single runtime**: JavaScript everywhere (no PHP/JS separation)
2. **npm ecosystem**: Massive library support for file processing, DB connections
3. **Fast development**: No compilation step, instant hot-reload with Vite
4. **Scalability**: Easy to deploy on any Node.js hosting platform

### Why React + Vite?
1. **Modern stack**: Fast build times, excellent developer experience
2. **Component reusability**: Share UI components between admin panels
3. **Large ecosystem**: Bootstrap 5 for quick styling without custom CSS

### Database Choice: MySQL for Metadata
- Lightweight storage for connections, mappings, import history
- Uses standard SQL, works with any database driver
- Can be replaced later if needed (PostgreSQL, SQLite, etc.)

---

## ⚠️ Potential Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Large Excel files (>50MB) | Use streaming parsers (`busboy`, `exceljs` stream mode) |
| Memory usage | Process in batches, don't load entire file into memory |
| MSSQL connection timeout | Configure connection pooling and timeouts properly |
| Transaction rollback | Implement proper SQL transaction handling |
| File size limits | Adjust Express + multer configuration (50MB default) |

---

## 📁 Project Structure (Final)

```
excel-importer/
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── connections.js     # Connection CRUD operations
│   │   │   └── imports.js         # Import execution & tracking
│   │   ├── services/
│   │   │   ├── fileParser.js      # Excel/CSV parsing logic
│   │   │   ├── dbService.js       # MySQL/MSSQL database operations
│   │   │   └── importProcessor.js # Batch import execution
│   │   ├── middleware/
│   │   │   ├── upload.js          # Multer file upload handling
│   │   │   └── validation.js      # Input validation
│   │   └── app.js                 # Express app setup + routes
│   ├── package.json               # Backend dependencies
│   ├── server.js                  # Server entry point
│   └── .env.example               # Environment template
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectionConfig.jsx  # MSSQL connection UI
│   │   │   ├── FileUpload.jsx        # File upload with preview
│   │   │   └── ColumnMapper.jsx      # Visual column mapping
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Main dashboard
│   │   │   └── ImportHistory.jsx     # Past imports list
│   │   ├── App.jsx                  # Root component
│   │   └── index.js                 # React entry point
│   ├── public/                      # Static assets
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.js               # Vite configuration
├── docker-compose.yml               # Docker services (optional)
├── .env                             # Environment variables
└── README.md                        # Documentation
```

---

## 🚦 Next Steps (Immediate Actions)

1. **Create server directory structure** with Express + dependencies
2. **Set up client directory** with React + Vite scaffolding
3. **Install core packages**:
   - Backend: `express`, `mssql`, `xlsx`, `mysql2`, `dotenv`
   - Frontend: `react`, `vite`, `bootstrap`, `axios`

Let me begin implementing this now! 🚀

---

*Last Updated: 2026-07-12 10:30 GMT+2 | Beginning JavaScript/Node.js implementation*
