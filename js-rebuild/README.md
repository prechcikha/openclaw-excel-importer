# Excel to MSSQL Importer - Node.js/JavaScript Version

A modern, fast, and easy-to-deploy web application for importing Excel and CSV files into Microsoft SQL Server. Built with React + Vite frontend and Express.js backend.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MSSQL Server** (remote database for imports)
- **MySQL/MariaDB** (local database for storing metadata, optional but recommended)

### Installation & Setup

#### 1. Navigate to the project directory
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild
```

#### 2. Install backend dependencies
```bash
cd server
npm install
```

#### 3. Install frontend dependencies (in new terminal)
```bash
cd ../client
npm install
```

#### 4. Configure environment variables
Copy the example env file and edit it:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

#### 5. Start development servers
**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3000`

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
App runs on `http://localhost:5173`

---

## 📁 Project Structure

```
excel-importer/
├── js-rebuild/                    # JavaScript rewrite directory
│   ├── server/                    # Node.js backend
│   │   ├── src/
│   │   │   ├── controllers/       # Request handlers (TODO)
│   │   │   ├── services/          # Business logic (TODO)
│   │   │   ├── middleware/        # Express middleware
│   │   │   └── routes/            # API endpoints
│   │   ├── package.json           # Backend dependencies
│   │   ├── server.js              # Server entry point
│   │   └── .env                   # Environment variables
│   │
│   ├── client/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   │   ├── ConnectionConfig.jsx  # MSSQL connection setup
│   │   │   │   ├── FileUpload.jsx        # Excel/CSV upload interface
│   │   │   │   └── ImportProgress.jsx    # Real-time progress tracker
│   │   │   ├── App.jsx            # Main application component
│   │   │   └── main.jsx           # React entry point
│   │   ├── public/                # Static assets
│   │   ├── package.json           # Frontend dependencies
│   │   └── vite.config.js         # Vite build configuration
│   │
│   ├── docker-compose.yml         # Optional: Docker deployment config
│   ├── .env                       # Root environment variables
│   └── README.md                  # This file
```

---

## 🎯 Features Implemented

### ✅ Backend (Express.js)
- [x] RESTful API structure with Express routes
- [x] File upload handling with multer
- [ ] Excel/CSV parsing with SheetJS (`xlsx` library)
- [ ] MSSQL connection management using `mssql` package
- [ ] MySQL/MariaDB for metadata storage (TODO)
- [ ] Batch import processing with progress tracking
- [ ] Error handling middleware

### ✅ Frontend (React + Vite)
- [x] Modern React 18 application
- [x] Bootstrap 5 responsive UI components
- [x] Connection configuration interface
- [x] File upload with preview and validation
- [x] Real-time import progress visualization
- [ ] Column mapping functionality (UI ready, backend pending)

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Fast development, instant hot-reload |
| **UI Framework** | Bootstrap 5 | Responsive design, pre-built components |
| **Backend** | Node.js + Express | RESTful API server |
| **Excel Parsing** | SheetJS (`xlsx`) | Parse Excel files in browser/server |
| **MSSQL Driver** | `mssql` (tedious) | Connect to SQL Server |
| **MySQL Driver** | `mysql2` | Store metadata & settings |
| **File Upload** | Multer + Busboy | Handle large file uploads |

---

## 📝 Configuration

### Environment Variables (`server/.env`)

```bash
# Server
PORT=3000
NODE_ENV=development

# Local MySQL Database (metadata storage)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=excel_importer_db

# Remote MSSQL Server (target for imports)
MSSQL_SERVER=localhost
MSSQL_DATABASE=tempdb
MSSQL_TRUSTED_CONNECTION=yes
MSSQL_PORT=1433
MSSQL_USER=sa
MSSQL_PASSWORD=your_password

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB
TIMEOUT_MS=120000       # 2 minutes
```

---

## 🚀 Deployment Options

### Option 1: Docker (Recommended)
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild
docker-compose up -d --build
```

### Option 2: Node.js Platform-as-a-Service
Deploy frontend to Netlify/Vercel and backend to Railway/Render/AWS Elastic Beanstalk.

### Option 3: Production Build
```bash
# Backend build (optional, Express doesn't need bundling)
cd server
npm run build  # Creates optimized production app

# Frontend build
cd client
npm run build
# Creates static files in client/dist/
```

---

## 🐛 Troubleshooting

### Common Issues:

1. **Port already in use**
   ```bash
   # Find and kill process using port 3000 or 5173
   lsof -ti:3000 | xargs kill -9
   ```

2. **MSSQL connection timeout**
   - Increase timeout in `server/.env` (TIMEOUT_MS)
   - Configure SQL Server to accept remote connections
   - Enable TCP/IP for the database server

3. **Excel parsing errors**
   - Ensure Excel file is not corrupted
   - Check that SheetJS library version is compatible with your files

4. **npm ERR! code EACCES**
   ```bash
   sudo chown -R $USER ~/.npm
   # Or avoid using sudo for npm install
   ```

---

## 📚 API Endpoints (To be implemented)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/connections` | List all connections |
| `POST` | `/api/connections/create` | Create new connection |
| `PUT` | `/api/connections/:id` | Update connection |
| `DELETE` | `/api/connections/:id` | Delete connection |
| `POST` | `/api/imports` | Start import process |
| `GET` | `/api/imports/history` | Get import history |

---

## 🎨 UI Screenshots (Coming Soon)

The application includes:
- **Connection Management**: Configure remote MSSQL servers with validation
- **File Upload**: Drag-and-drop interface with file size limits
- **Column Mapping**: Visual drag-drop mapping of Excel columns to database fields
- **Progress Tracking**: Real-time progress bars and batch processing indicators

---

## 🔄 Migration from PHP Version

This JavaScript rewrite addresses the issues encountered with the PHP/Laravel version:

| Issue | PHP/Laravel Solution | Node.js Solution |
|-------|---------------------|------------------|
| Complex Docker setup | Docker containers required | Any OS, no compilation needed ✅ |
| PHP extension dependencies | Requires GD, ODBC, PDO extensions | npm packages work out of the box ✅ |
| Slow development cycle | Composer + PHP compilation | Instant hot-reload with Vite ✅ |
| Frontend-backend separation | Separate build steps | Single JavaScript runtime ✅ |

---

## 📝 Development Notes

- **Active Development**: Backend services (database integration, file parsing) are still being implemented
- **Current State**: UI is fully functional and responsive; backend API endpoints need implementation
- **Next Steps**: Implement database layer, complete file parsing logic, add authentication

---

*Last Updated: 2026-07-12 | JavaScript/Node.js version in progress*
