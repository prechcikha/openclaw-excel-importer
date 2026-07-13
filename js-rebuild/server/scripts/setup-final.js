const mysql = require('mysql2/promise');

async function setup() {
    const config = { host: 'localhost', port: 3306, user: 'root' };
    
    console.log('Setting up Excel Importer database...\n');
    
    let conn;
    try {
        conn = await mysql.createConnection(config);
        
        try { await conn.query('USE excel_importer_db'); } 
        catch (e) { if (e.code === 'ER_BAD_DB_ERROR') { await conn.query('CREATE DATABASE excel_importer_db'); await conn.end(); conn = await mysql.createConnection(config); await conn.query('USE excel_importer_db'); console.log('✓ Created database\n'); } else throw e; }

        // Create tables
        await conn.query("CREATE TABLE IF NOT EXISTS connections (id INT AUTO_INCREMENT PRIMARY KEY, server VARCHAR(255), host VARCHAR(100), port INT DEFAULT 1433, `database` VARCHAR(100), username VARCHAR(100), password VARCHAR(255))");
        console.log('✓ Created connections table');

        await conn.query("CREATE TABLE IF NOT EXISTS uploads (id INT AUTO_INCREMENT PRIMARY KEY, filename VARCHAR(255) UNIQUE, original_name VARCHAR(255), mime_type VARCHAR(100), file_size BIGINT DEFAULT 0, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, import_id VARCHAR(255))");
        console.log('✓ Created uploads table');

        await conn.query("CREATE TABLE IF NOT EXISTS imports (id VARCHAR(255) PRIMARY KEY, connection_id INT NOT NULL, file_name VARCHAR(255), file_size BIGINT DEFAULT 0, columns_count INT DEFAULT 0, rows_count INT DEFAULT 0, upload_date DATETIME DEFAULT CURRENT_TIMESTAMP, status ENUM('ready', 'mapping_in_progress', 'importing', 'completed', 'failed') DEFAULT 'ready', error_message TEXT)");
        console.log('✓ Created imports table');

        await conn.query("CREATE TABLE IF NOT EXISTS import_mappings (id INT AUTO_INCREMENT PRIMARY KEY, import_id VARCHAR(255), source_column VARCHAR(100), target_field VARCHAR(100))");
        console.log('✓ Created import_mappings table');

        await conn.query("CREATE TABLE IF NOT EXISTS import_history (id INT AUTO_INCREMENT PRIMARY KEY, import_id VARCHAR(255) NOT NULL, started_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME, records_processed INT DEFAULT 0, status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress')");
        console.log('✓ Created import_history table');

        await conn.query("INSERT IGNORE INTO connections (id, server, host, `database`, username) VALUES (1, 'Local MySQL Test Database', 'localhost', 'excel_importer_db', 'root')");
        console.log('✓ Inserted sample connection');

        await conn.query("INSERT IGNORE INTO imports (id) VALUES ('test-1')");
        console.log('✓ Inserted sample import');

        const [tables] = await conn.query('SHOW TABLES');
        console.log(`\n✅ Database setup complete! (${tables.length} tables)\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally { if (conn) await conn.end(); }
}

setup();
