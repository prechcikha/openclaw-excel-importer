/**
 * Database Setup Script
 * Creates all required tables and inserts sample data
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'excel_importer_db'
    };

    console.log('='.repeat(70));
    console.log('EXCEL IMPORTER - DATABASE SETUP');
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

        console.log('✅ Connected to MySQL server');
        
        // Switch to database or create it
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
                console.log('✅ Database created and connected');
            } else {
                throw err;
            }
        }

        // Read SQL script
        const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('\n📄 Executing database schema...');
        
        // Execute the SQL script
        await connection.query(sql);
        
        console.log('✅ Schema executed successfully!');
        
        // Verify tables were created
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`\n📊 Tables created: ${tables.length}`);
        tables.forEach(table => {
            console.log(`   - ${table['Tables_in_excel_importer_db']}`);
        });

        // Verify sample data
        const [imports] = await connection.query('SELECT COUNT(*) as count FROM imports');
        const [mappings] = await connection.query('SELECT COUNT(*) as count FROM import_mappings');
        const [history] = await connection.query('SELECT COUNT(*) as count FROM import_history');

        console.log('\n📋 Sample data inserted:');
        console.log(`   - Imports: ${imports[0].count}`);
        console.log(`   - Mappings: ${mappings[0].count}`);
        console.log(`   - History records: ${history[0].count}`);

    } catch (error) {
        console.error('\n❌ Database setup failed!');
        console.error('Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure MySQL/MariaDB is running');
        console.error('2. Check connection settings in .env file');
        console.error('3. Verify database user has proper permissions');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run setup
setupDatabase().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
