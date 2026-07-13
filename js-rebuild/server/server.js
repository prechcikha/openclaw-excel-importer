require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes and middleware
const connectionRoutes = require('./src/routes/connections');
const importRoutes = require('./src/routes/imports');
const uploadMiddleware = require('./src/middleware/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (React build)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API Routes
app.use('/api/connections', connectionRoutes);
app.use('/api/imports', importRoutes);

// React app for all other routes (in development)
if (process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Excel Importer Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Available at: http://localhost:${PORT}/api`);
});

module.exports = app;
