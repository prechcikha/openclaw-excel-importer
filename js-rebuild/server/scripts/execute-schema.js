/**
 * Database Schema Execution Script
 * Uses mysql2 package to create all required tables and insert sample data
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executeSchema() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'excel_importer_db'
    };

    console.log('='.repeat(70));
    console.log('EXCEL IMPORTER - DATABASE SCHEMA EXECUTION');
    console.log('='.repeat(70));
    console.log(`\nConnecting to MySQL at ${config.host}:${config.port}...`);
    
    let connection;
    try {
        // Connect without database first
        connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password
        });

        console.log('✅ Connected to MySQL server\n');

        // Switch to or create database
        try {
            await connection.query(`USE \`${config.database}\``);
            console.log(`✅ Using database: ${config.database}`);
        } catch (err) {
            if (err.code === 'ER_BAD_DB_ERROR') {
                console.log(`⚠️  Database '${config.database}' doesn't exist, creating...`);
                await connection.query(`CREATE DATABASE \`${config.database}\``);
                await connection.end();

                // Reconnect with database
                connection = await mysql.createConnection(config);
                await connection.query(`USE \`${config.database}\``);
                console.log('✅ Database created and connected\n');
            } else {
                throw err;
            }
        }

        // Read SQL script
        const sqlPath = path.join(__dirname, '..', '..', 'database', 'schema_clean.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error('❌ Schema file not found:', sqlPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Executing database schema...\n');

        // Execute the SQL script in chunks (transactions)
        await connection.query('START TRANSACTION');
        
        try {
            await connection.query(sql);
            console.log('✅ Schema executed successfully!\n');
        } catch (err) {
            await connection.rollback();
            throw err;
        }

        await connection.query('COMMIT');

        // Verify tables were created
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Tables created: ${tables.length}`);
        tables.forEach(table => {
            const tableName = table['Tables_in_excel_importer_db'];
            console.log(`   - ${tableName}`);
        });

        // Verify sample data
        const [imports] = await connection.query('SELECT COUNT(*) as count FROM imports');
        const [mappings] = await connection.query('SELECT COUNT(*) as count FROM import_mappings');
        const [history] = await connection.query('SELECT COUNT(*) as count FROM import_history');

        console.log('\n📋 Sample data inserted:');
        console.log(`   - Imports records: ${imports[0].count}`);
        console.log(`   - Mappings records: ${mappings[0].count}`);
        console.log(`   - History records: ${history[0].count}`);

        // Show table structures
        console.log('\n📐 Table structures verified:');
        
        const [importsDesc] = await connection.query('DESCRIBE imports');
        console.log(`\n   imports table (${importsDesc.length} columns):`);
        importsDesc.forEach(row => {
            console.log(`      - ${row.Field}: ${row.Type}`);
        });

    } catch (error) {
        console.error('\n❌ Database setup failed!');
        console.error('Error:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\nAuthentication failed. Check your MySQL credentials.');
            console.error('Try: mysql -u root -p and check permissions in mysql.user table');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\nConnection refused. Make sure MySQL is running:');
            console.error('  sudo systemctl start mysql');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run setup
executeSchema().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
