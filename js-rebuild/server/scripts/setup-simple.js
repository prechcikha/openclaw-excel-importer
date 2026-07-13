/**
 * Simple Database Setup - Statement by Statement Execution
 */

const mysql = require('mysql2/promise');

async function setupDatabase() {
    const config = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
    };

    console.log('Setting up Excel Importer database...\n');

    let conn;
    try {
        conn = await mysql.createConnection(config);
        
        // Create or use database
        try {
            await conn.query('USE excel_importer_db');
            console.log('✓ Using existing database');
        } catch (err) {
            if (err.code === 'ER_BAD_DB_ERROR') {
                await conn.query(`CREATE DATABASE excel_importer_db`);
                await conn.end();
                conn = await mysql.createConnection(config);
                await conn.query('USE excel_importer_db');
                console.log('✓ Created new database');
            } else {
                throw err;
            }
        }

        // Create uploads table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                original_name VARCHAR(255),
                mime_type VARCHAR(100),
                file_size BIGINT DEFAULT 0,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                import_id VARCHAR(255),
                FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Created uploads table');

        // Create imports table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS imports (
                id VARCHAR(255) PRIMARY KEY,
                connection_id INT NOT NULL,
                file_name VARCHAR(255),
                file_size BIGINT DEFAULT 0,
                columns_count INT DEFAULT 0,
                rows_count INT DEFAULT 0,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('ready', 'mapping_in_progress', 'importing', 'completed', 'failed') DEFAULT 'ready',
                error_message TEXT,
                records_imported INT DEFAULT 0,
                records_failed INT DEFAULT 0,
                duration_ms INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (connection_id) REFERENCES connections(id)
            )
        `);
        console.log('✓ Created imports table');

        // Create import_mappings table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS import_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                import_id VARCHAR(255) NOT NULL,
                source_column VARCHAR(100),
                target_field VARCHAR(100),
                transformation VARCHAR(200),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Created import_mappings table');

        // Create import_history table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS import_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                import_id VARCHAR(255) NOT NULL,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                records_processed INT DEFAULT 0,
                status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
                error_message TEXT,
                FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Created import_history table');

        // Insert sample connection data
        await conn.query(`INSERT IGNORE INTO connections VALUES (NULL, 'Local MySQL Test', 'localhost', 3306, 'excel_importer_db', 'root', '', NOW())`);
        console.log('✓ Inserted sample connection');

        // Insert sample import data
        await conn.query(`INSERT IGNORE INTO imports (id) VALUES ('test-1')`);
        console.log('✓ Inserted sample import record');

        // Show tables
        const [tables] = await conn.query('SHOW TABLES');
        console.log(`\n✅ Database setup complete!`);
        console.log(`   Tables created: ${tables.length}`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

setupDatabase();
