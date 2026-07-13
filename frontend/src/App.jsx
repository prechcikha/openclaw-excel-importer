import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConnectionConfig from './components/ConnectionConfig';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import ImportProgress from './components/ImportProgress';
import toast from './utils/toast';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ConnectionConfig />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/map/:filename" element={<ColumnMapper />} />
          <Route path="/import/:jobId" element={<ImportProgress />} />
        </Routes>
        {/* Toast Notifications */}
        {toast.render()}
      </div>
    </Router>
  );
}

export default App;
