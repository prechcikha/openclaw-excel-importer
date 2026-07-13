# Quick Start Guide - JavaScript Version (2026-07-12)

## 🚀 Get Running in 5 Minutes

### Step 1: Install Backend Dependencies (~2 minutes)
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/server
npm install
```

**Expected Output:**
```
added 40 packages, and audited 41 packages in 5s
found 0 vulnerabilities
```

### Step 2: Install Frontend Dependencies (~3 minutes)
Open a **new terminal** and run:
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/client
npm install
```

**Expected Output:**
```
added 85 packages, and audited 86 packages in 4s
found 0 vulnerabilities
```

### Step 3: Start Backend Server
In the **first terminal**, run:
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/server
npm run dev
```

**Expected Output:**
```
🚀 Excel Importer Server running on port 3000
   Environment: development
   API Available at: http://localhost:3000/api
```

### Step 4: Start Frontend App
In the **second terminal**, run:
```bash
cd /home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/client
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 5: Open Your Browser
Navigate to: **http://localhost:5173**

You should see the Excel to MSSQL Importer interface with three tabs:
- ✅ Connections (MSSQL connection form)
- ✅ Upload File (Drag-and-drop file upload)
- ✅ Import Progress (Progress tracking simulation)

---

## 📁 What You'll See

### Connection Config Tab:
- Form fields for server name, host, port, database, username, password
- "Save Connection" and "Test Connection" buttons

### Upload File Tab:
- Drag-and-drop zone for Excel/CSV files
- File size validation (50MB limit)
- File type validation (.xlsx, .xls, .csv only)
- Preview area showing loaded file info

### Import Progress Tab:
- Progress bars with real-time updates
- Simulated import process demonstration
- Import history list

---

## ⚠️ Next Steps After Running (When You Return)

The application is **visually complete** but needs backend logic. Here's what to do next:

### 1. Create MySQL Database
```bash
# If MySQL is installed locally:
mysql -u root -p
CREATE DATABASE excel_importer_db;
exit;
```

### 2. Update Environment File
Edit `js-rebuild/server/.env` and fill in your database credentials:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=excel_importer_db
```

### 3. Implement Database Schema
Create a file at `server/database/schema.sql`:
```sql
-- Add the full schema from REPLANNING_2026-07-12.md
```

### 4. Connect Frontend to Backend
Update each component's submit handlers to make actual API calls instead of console.log statements.

---

## 🐛 Common Issues & Fixes

### "npm ERR! code EACCES" (Permission Denied)
```bash
# Run npm without sudo, or fix permissions:
sudo chown -R $USER ~/.npm
```

### "Port 3000 already in use"
```bash
# Kill process using port 3000:
lsof -ti:3000 | xargs kill -9
```

### Dependencies not installing
```bash
# Clear npm cache and try again:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md` for complete API reference
- **Implementation Plan**: See `REPLANNING_2026-07-12.md` for detailed technical decisions
- **Session Memory**: Check `MEMORY_2026-07-12.md` for current progress tracking

---

## 🎯 Success Checklist (When You Return)

Run through this checklist to verify everything is working:

- [ ] Backend server started on port 3000
- [ ] Frontend app running on http://localhost:5173
- [ ] Can see all three tabs in navigation
- [ ] Connection form displays correctly
- [ ] File upload shows drag-and-drop zone
- [ ] Progress tab shows progress bar

If all items checked ✅, the UI is ready! Next step: implement backend database logic.

---

*Quick Start Guide created: 2026-07-12 | Ready for when you return in ~1 hour*
