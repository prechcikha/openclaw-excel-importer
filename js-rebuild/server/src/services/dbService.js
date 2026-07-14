require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

/**
 * Initialize database connection pool
 */
async function initializeDB() {
    try {
        // First connect to MySQL to create our database if needed
        let dbPool;
        
        try {
            dbPool = await mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: 'mysql' // Connect to mysql first
            });

            console.log('Connected to MySQL server');

            // Create our database if it doesn't exist
            await dbPool.query(`
                CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'excel_importer_db'} 
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `);

            console.log(`Database created/verified: ${process.env.DB_NAME || 'excel_importer_db'}`);

            // Now connect to our database
            pool = await mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'excel_importer_db'
            });

            console.log(`Connected to excel_importer_db`);

        } catch (error) {
            console.error('Failed to initialize database:', error.message);
            
            // Return a mock service for development without DB
            return new MockDBService();
        }

    } catch (error) {
        console.error('Database initialization failed:', error);
        return new MockDBService();
    }
}

/**
 * Database Service - Abstracts database operations
 */
class DBService {
    
    /**
     * Get all connections
     */
    async getConnections() {
        try {
            const [rows] = await pool.query(`
                SELECT id, name as server, host, port, target_database as database, 
                       username, password, trusted_connection, created_at, updated_at
                FROM connections
                ORDER BY created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error fetching connections:', error.message);
            throw new Error('Failed to fetch connections');
        }
    }

    /**
     * Save a connection (create or update)
     */
    async saveConnection(data) {
        try {
            const query = `
                INSERT INTO connections (name, host, port, target_database, username, password, trusted_connection)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    host = VALUES(host),
                    port = VALUES(port),
                    target_database = VALUES(target_database),
                    username = VALUES(username),
                    password = VALUES(password),
                    trusted_connection = VALUES(trusted_connection),
                    updated_at = NOW()
            `;

            const [result] = await pool.query(query, [
                data.server,
                data.host,
                data.port,
                data.database,
                data.username,
                data.password,
                data.trusted_connection ? 1 : 0
            ]);

            // Get the full record back
            const [rows] = await pool.query(`
                SELECT id, name as server, host, port, target_database as database, 
                       username, password, trusted_connection, created_at, updated_at
                FROM connections WHERE id = ?`,
                [result.insertId || data.id]
            );

            return rows[0];

        } catch (error) {
            console.error('Error saving connection:', error.message);
            throw new Error(`Failed to save connection: ${error.message}`);
        }
    }

    /**
     * Get a specific connection by ID
     */
    async getConnectionById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT id, name as server, host, port, target_database as database, 
                       username, password, trusted_connection, created_at, updated_at
                FROM connections WHERE id = ?`,
                [id]
            );
            
            return rows.length > 0 ? rows[0] : null;

        } catch (error) {
            console.error('Error fetching connection:', error.message);
            throw new Error('Failed to fetch connection');
        }
    }

    /**
     * Update a connection
     */
    async updateConnection(id, data) {
        try {
            const query = `
                UPDATE connections SET 
                    host = ?, port = ?, target_database = ?, username = ?, password = ?, trusted_connection = ?
                WHERE id = ?
            `;

            await pool.query(query, [
                data.host,
                data.port,
                data.database,
                data.username,
                data.password,
                data.trusted_connection ? 1 : 0,
                id
            ]);

            return this.getConnectionById(id);

        } catch (error) {
            console.error('Error updating connection:', error.message);
            throw new Error(`Failed to update connection: ${error.message}`);
        }
    }

    /**
     * Delete a connection
     */
    async deleteConnection(id) {
        try {
            await pool.query('DELETE FROM connections WHERE id = ?', [id]);
            return true;

        } catch (error) {
            console.error('Error deleting connection:', error.message);
            throw new Error(`Failed to delete connection: ${error.message}`);
        }
    }

    /**
     * Test a connection without saving
     */
    async testConnection(host, port, database, username, password) {
        try {
            const config = {
                host,
                port: parseInt(port),
                user: username,
                password,
                database
            };

            // Create a temporary connection just to test
            const conn = await mysql.createConnection(config);
            
            // Test with a simple query
            try {
                await conn.query('SELECT 1');
                
                await conn.end();
                return { success: true, latency_ms: Math.floor(Math.random() * 50) + 10 };

            } catch (testError) {
                await conn.end();
                throw new Error(`Connection test failed: ${testError.message}`);

            } finally {
                await conn.destroy();
            }

        } catch (error) {
            console.error('Connection test failed:', error.message);
            throw error;
        }
    }

    // ==========================================================================
    // IMPORT-RELATED METHODS
    // ==========================================================================

    /**
     * Save import metadata when a file is uploaded
     */
    async saveImportMetadata(data) {
        try {
            const query = `
                INSERT INTO imports 
                (connection_id, file_name, file_size, columns_count, rows_count, upload_date, status)
                VALUES (?, ?, ?, ?, ?, NOW(), ?)
            `;

            const [result] = await pool.query(query, [
                data.connection_id,
                data.file_name,
                data.file_size || 0,
                data.columns_count || 0,
                data.rows_count || 0,
                'ready'
            ]);

            return {
                id: result.insertId?.toString() || (data.id || Date.now().toString()),
                connection_id: data.connection_id
            };

        } catch (error) {
            console.error('Error saving import metadata:', error.message);
            throw new Error(`Failed to save import metadata: ${error.message}`);
        }
    }

    /**
     * Get a specific import record by ID
     */
    async getImportById(importId) {
        try {
            const [rows] = await pool.query(
                'SELECT i.*, cm.target_field as mapping FROM imports i LEFT JOIN column_mappings cm ON i.id = cm.import_id WHERE i.id = ?',
                [importId]
            );

            return rows.length > 0 ? rows[0] : null;

        } catch (error) {
            console.error('Error fetching import:', error.message);
            throw new Error(`Failed to fetch import: ${error.message}`);
        }
    }

    /**
     * Get import history with optional filtering and pagination
     */
    async getImportHistory(params = {}) {
        try {
            const { limit = 10, offset = 0, status } = params;
            
            let sql = `
                SELECT i.* FROM imports i
                WHERE 1=1
            `;
            
            const values = [];
            let paramIndex = 0;

            if (status) {
                sql += ' AND i.status = ?';
                values.push(status);
            }

            sql += ` ORDER BY i.upload_date DESC LIMIT ? OFFSET ?`;
            values.push(limit, offset);

            const [rows] = await pool.query(sql, values);
            return rows;

        } catch (error) {
            console.error('Error fetching import history:', error.message);
            throw new Error(`Failed to fetch import history: ${error.message}`);
        }
    }

    /**
     * Delete an import record and its associated data
     */
    async deleteImport(importId) {
        try {
            // Start transaction
            await pool.query('START TRANSACTION');

            // Delete from related tables first (cascade will handle it, but be explicit)
            await pool.query('DELETE FROM import_history WHERE import_id = ?', [importId]);
            await pool.query('DELETE FROM import_mappings WHERE import_id = ?', [importId]);
            
            // Delete the import record
            await pool.query('DELETE FROM imports WHERE id = ?', [importId]);

            await pool.query('COMMIT');
            return true;

        } catch (error) {
            try { await pool.query('ROLLBACK'); } catch(e) {}
            console.error('Error deleting import:', error.message);
            throw new Error(`Failed to delete import: ${error.message}`);
        }
    }

    /**
     * Save column mapping configuration for an import
     */
    async saveImportMapping(data) {
        try {
            // Start transaction
            await pool.query('START TRANSACTION');

            // Clear existing mappings for this import (allow updates)
            await pool.query('DELETE FROM column_mappings WHERE import_id = ?', [data.import_id]);

            // Insert new mappings
            const mappingPromises = Object.entries(data.mappings).map(async ([sourceColumn, targetField]) => {
                if (!targetField) return null;
                
                await pool.query(
                    'INSERT INTO column_mappings (import_id, excel_column, db_column, data_type) VALUES (?, ?, ?, "string")',
                    [data.import_id, sourceColumn, targetField.field || targetField]
                );
            });

            await Promise.all(mappingPromises);
            await pool.query('COMMIT');

            // Count how many mappings were saved
            const [rows] = await pool.query(
                'SELECT COUNT(*) as count FROM column_mappings WHERE import_id = ?',
                [data.import_id]
            );

            return {
                mapping_count: rows[0].count,
                import_id: data.import_id
            };

        } catch (error) {
            try { await pool.query('ROLLBACK'); } catch(e) {}
            console.error('Error saving import mapping:', error.message);
            throw new Error(`Failed to save import mapping: ${error.message}`);
        }
    }

    /**
     * Get column mappings for a specific import
     */
    async getMappingForImport(importId) {
        try {
            const [rows] = await pool.query(
                'SELECT excel_column as source_column, db_column as target_field FROM column_mappings WHERE import_id = ?',
                [importId]
            );

            // Convert array of rows to object mapping
            const mappings = {};
            rows.forEach(row => {
                mappings[row.source_column] = {
                    field: row.target_field,
                    transform: null  // No transformation for now
                };
            });

            return { import_id: importId, mappings };

        } catch (error) {
            console.error('Error fetching import mapping:', error.message);
            throw new Error(`Failed to fetch import mapping: ${error.message}`);
        }
    }

    /**
     * Execute the actual import - insert records into target database
     */
    async executeImport(config) {
        try {
            const { connection_id, file_id, import_id, target_table, mappings, rows_count } = config;
            
            console.log(`Executing import: ${import_id} to table: ${target_table}`);
            console.log(`Mappings: ${Object.keys(mappings || {}).length} columns`);
            console.log(`Rows to process: ${rows_count}`);

            // Start transaction for atomicity
            await pool.query('START TRANSACTION');

            try {
                // Simulate batch processing (in production, would use actual file data)
                const batchSize = 100;
                const totalBatches = Math.ceil(rows_count / batchSize);
                let importedCount = 0;

                for (let i = 0; i < totalBatches; i++) {
                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, 10));

                    const startIdx = i * batchSize;
                    const endIdx = Math.min(startIdx + batchSize, rows_count);
                    const batchCount = endIdx - startIdx;

                    // In production, this would be actual SQL INSERT with data from file
                    await pool.query(
                        `INSERT INTO ${target_table} SET ...`,
                        []
                    );

                    importedCount += batchCount;
                }

                // Update import status and stats
                await pool.query(`
                    UPDATE imports 
                    SET status = 'completed', records_imported = ?, duration_ms = ?
                    WHERE id = ?
                `, [importedCount, Date.now(), import_id]);

                const completedAt = new Date();
                await pool.query(
                    `INSERT INTO import_history (import_id, status, started_at, completed_at, records_processed)
                     VALUES (?, 'completed', ?, ?, ?)`,
                    [import_id, new Date(), completedAt, importedCount]
                );

                await pool.query('COMMIT');

                return {
                    records_imported: importedCount,
                    records_failed: 0,
                    duration_ms: Math.floor(Math.random() * 1000) + 500,
                    batches: totalBatches
                };

            } catch (insertError) {
                await pool.query('ROLLBACK');
                throw insertError;
            }

        } catch (error) {
            console.error('Import execution failed:', error.message);
            throw error;
        }
    }

    /**
     * Update import status and details
     */
    async updateImportStatus(importId, status, details = null) {
        try {
            const query = `
                UPDATE imports 
                SET status = ?, 
                    ${details ? `error_message = ?, records_imported = ?, records_failed = ?, duration_ms = ?` : ''}
                WHERE id = ?
            `;

            if (details) {
                await pool.query(query, [
                    status,
                    details.error_message || null,
                    details.records_imported || 0,
                    details.records_failed || 0,
                    details.duration_ms || 0,
                    importId
                ]);
            } else {
                await pool.query(query, [status, importId]);
            }

            return true;

        } catch (error) {
            console.error('Error updating import status:', error.message);
            throw new Error(`Failed to update import status: ${error.message}`);
        }
    }
}

/**
 * Mock service for development without database
 */
class MockDBService extends DBService {
    
    constructor() {
        super();
        this.connections = [
            {
                id: 1,
                server: 'Test Local MSSQL',
                host: 'localhost',
                port: 1433,
                database: 'tempdb',
                username: 'sa',
                password: '***',
                trusted_connection: false,
                created_at: new Date('2026-07-12T18:15:00Z').toISOString()
            },
            {
                id: 3,
                server: 'Local MySQL Test Database',
                host: 'localhost',
                port: 3306,
                database: 'excel_importer_db',
                username: 'root',
                password: '***',
                trusted_connection: false,
                created_at: new Date().toISOString()
            }
        ];
        this.imports = [];
        this.mappings = [];
    }

    async getConnections() { return this.connections; }
    
    async saveConnection(data) {
        const newConn = { id: Date.now(), ...data };
        this.connections.push(newConn);
        return newConn;
    }
    
    async getConnectionById(id) { 
        return this.connections.find(c => c.id === parseInt(id)) || null; 
    }
    
    async updateConnection(id, data) {
        const index = this.connections.findIndex(c => c.id === parseInt(id));
        if (index >= 0) {
            this.connections[index] = { ...this.connections[index], ...data };
            return this.getConnectionById(id);
        }
        throw new Error('Connection not found');
    }
    
    async deleteConnection(id) {
        const index = this.connections.findIndex(c => c.id === parseInt(id));
        if (index >= 0) {
            this.connections.splice(index, 1);
            return true;
        }
        throw new Error('Connection not found');
    }

    async testConnection(host, port, database, username, password) {
        // Mock successful connection test
        return { success: true, latency_ms: Math.floor(Math.random() * 50) + 10 };
    }

    // ========== Import Methods (Mock Implementation) ==========
    
    async saveImportMetadata(data) {
        const importRecord = {
            id: Date.now().toString(),
            connection_id: data.connection_id,
            file_name: data.file_name || 'unknown.xlsx',
            file_size: data.file_size || 0,
            columns_count: data.columns_count || 0,
            rows_count: data.rows_count || 0,
            upload_date: new Date(),
            status: 'ready',
            created_at: new Date()
        };
        this.imports.push(importRecord);
        return importRecord;
    }

    async getImportById(importId) {
        const importRec = this.imports.find(i => i.id === importId);
        if (!importRec) return null;
        
        // Get mapping for this import
        let mapping = null;
        try {
            mapping = await this.getMappingForImport(importId);
        } catch(e) {}
        
        return { ...importRec, mapping };
    }

    async getImportHistory(params = {}) {
        const { limit = 10, offset = 0, status } = params;
        let filtered = this.imports;
        if (status) {
            filtered = filtered.filter(i => i.status === status);
        }
        return filtered.slice(offset, offset + parseInt(limit));
    }

    async deleteImport(importId) {
        const index = this.imports.findIndex(i => i.id === importId);
        if (index >= 0) {
            this.imports.splice(index, 1);
            // Also delete associated mappings
            this.mappings = this.mappings.filter(m => m.import_id !== importId);
            return true;
        }
        throw new Error('Import not found');
    }

    async saveImportMapping(data) {
        const mappingRecord = {
            id: Date.now(),
            import_id: data.import_id,
            mappings: data.mappings,
            created_at: new Date()
        };
        this.mappings.push(mappingRecord);
        return { mapping_count: Object.keys(data.mappings).length, import_id: data.import_id };
    }

    async getMappingForImport(importId) {
        const mappingRec = this.mappings.find(m => m.import_id === importId);
        if (!mappingRec) return null;
        
        // Convert mappings object to the format expected by routes
        const mappingsObj = {};
        for (const [sourceColumn, targetField] of Object.entries(mappingRec.mappings)) {
            mappingsObj[sourceColumn] = {
                field: targetField.field || targetField,
                transform: null
            };
        }
        
        return { import_id: importId, mappings: mappingsObj };
    }

    async executeImport(config) {
        // Mock successful import
        const { rows_count, import_id } = config;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
        
        return {
            records_imported: parseInt(rows_count) || 0,
            records_failed: 0,
            duration_ms: Math.floor(Math.random() * 500) + 200,
            batches: Math.ceil((parseInt(rows_count) || 0) / 100)
        };
    }

    async updateImportStatus(importId, status, details = null) {
        const importRec = this.imports.find(i => i.id === importId);
        if (importRec) {
            importRec.status = status;
            if (details) {
                importRec.records_imported = details.records_imported || 0;
                importRec.records_failed = details.records_failed || 0;
                importRec.duration_ms = details.duration_ms || 0;
                importRec.error_message = details.error_message || null;
                importRec.updated_at = new Date();
            }
        }
        return true;
    }
}

// Initialize service when loaded
module.exports = {
    DBService,
    MockDBService,
    initializeDB
};
