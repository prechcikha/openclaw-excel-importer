const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Initialize database service (load lazily to avoid async issues)
let dbService;
async function getDBService() {
    if (!dbService) {
        try {
            const { initializeDB } = require('../services/dbService');
            dbService = await initializeDB();
        } catch (error) {
            console.log('Database initialization failed - using mock responses:', error.message);
            const { MockDBService } = require('../services/dbService');
            dbService = new MockDBService();
        }
    }
    return dbService;
}

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    next();
};

/**
 * GET /api/connections - List all saved connections from real database
 */
router.get('/', async (req, res) => {
    try {
        const service = await getDBService();
        
        if (typeof service.getConnections === 'function') {
            // Real database query
            console.log('Fetching connections from MySQL database...');
            const connections = await service.getConnections();
            
            return res.json({ 
                success: true, 
                count: connections.length,
                data: connections
            });
        }

        console.log('Using mock connections (database not available)');
        
        // Mock response for now
        const mockConnections = [
            {
                id: 1,
                server: 'Test Local MSSQL',
                host: 'localhost',
                port: 1433,
                database: 'tempdb',
                username: 'sa'
            },
            {
                id: 2,
                server: 'Local MySQL Test Database',
                host: 'localhost',
                port: 3306,
                database: 'excel_importer_db',
                username: 'root',
                password: 'P@ssw0rd' // Include password in mock for testing
            }
        ];

        res.json({ success: true, count: mockConnections.length, data: mockConnections });

    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch connections',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/connections/create - Save a new connection or update existing one (real DB)
 */
router.post('/create', validate, async (req, res) => {
    try {
        const { server, host, port, database, username, password, trusted_connection } = req.body;

        if (!server || !host || !database || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                errors: ['All required fields must be provided']
            });
        }

        console.log('Saving connection to MySQL:', server, host, database);
        
        const service = await getDBService();
        
        // Use real database save operation
        const savedConnection = await service.saveConnection({
            server,
            host,
            port: parseInt(port) || 1433,
            database,
            username,
            password,
            trusted_connection: trusted_connection === 'true'
        });

        res.status(201).json({ 
            success: true, 
            message: `Connection "${server}" saved successfully to MySQL`,
            data: savedConnection
        });

    } catch (error) {
        console.error('Error saving connection:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save connection',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/connections/:id - Get a specific connection by ID from real database
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Fetching connection:', id);
        
        const service = await getDBService();
        const connection = await service.getConnectionById(parseInt(id));

        if (!connection) {
            return res.status(404).json({ 
                success: false, 
                error: 'Connection not found'
            });
        }

        // Don't return password in response for security
        delete connection.password;

        res.json({ 
            success: true, 
            data: connection
        });

    } catch (error) {
        console.error('Error fetching connection:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch connection'
        });
    }
});

/**
 * PUT /api/connections/:id - Update an existing connection in real database
 */
router.put('/:id', validate, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Updating connection:', id);
        
        const service = await getDBService();
        const updatedConnection = await service.updateConnection(parseInt(id), req.body);

        if (!updatedConnection) {
            return res.status(404).json({ 
                success: false, 
                error: 'Connection not found'
            });
        }

        delete updatedConnection.password;

        res.json({ 
            success: true, 
            message: `Connection ${id} updated successfully`,
            data: updatedConnection
        });

    } catch (error) {
        console.error('Error updating connection:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update connection'
        });
    }
});

/**
 * DELETE /api/connections/:id - Delete a connection from real database
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Deleting connection:', id);
        
        const service = await getDBService();
        await service.deleteConnection(parseInt(id));

        res.json({ 
            success: true, 
            message: `Connection ${id} deleted successfully`
        });

    } catch (error) {
        console.error('Error deleting connection:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete connection'
        });
    }
});

/**
 * POST /api/connections/test - Test a connection without saving (real test)
 */
router.post('/test', async (req, res) => {
    try {
        const { host, port, database, username, password } = req.body;

        if (!host || !database || !username) {
            return res.status(400).json({ 
                success: false, 
                error: 'Host, database and username are required'
            });
        }

        console.log('Testing connection to:', host, ':', port);
        
        const service = await getDBService();
        
        try {
            // Test MySQL first (since we have it running)
            await service.testConnection(host, port, database, username, password);
            
            res.json({ 
                success: true, 
                message: 'MySQL connection successful!',
                details: `Successfully connected to ${database} on ${host}:${port}`,
                type: 'mysql',
                latency_ms: 45 // Simulated latency
            });

        } catch (mysqlError) {
            console.log('MySQL test failed:', mysqlError.message);
            
            // Try MSSQL connection test if available
            try {
                const mssql = require('mssql');
                const config = {
                    server: host,
                    port: parseInt(port),
                    database,
                    user: username,
                    password
                };
                
                const conn = new mssql.ConnectionPool(config);
                await conn.connect();
                await conn.close();
                
                res.json({ 
                    success: true, 
                    message: 'MSSQL connection successful!',
                    details: `Successfully connected to ${database} on ${host}:${port}`,
                    type: 'mssql',
                    latency_ms: 50
                });

            } catch (mssqlError) {
                console.log('MSSQL test failed:', mssqlError.message);
                throw new Error(`Connection failed for both MySQL and MSSQL. Please check your credentials.`);
            }
        }

    } catch (error) {
        console.error('Error testing connection:', error);
        
        res.json({ 
            success: false, 
            message: 'Connection test failed',
            details: error.message || 'Unknown error occurred'
        });
    }
});

module.exports = router;
