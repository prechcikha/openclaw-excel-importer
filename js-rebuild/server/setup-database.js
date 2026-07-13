require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log('🔧 Setting up MySQL database...');
    
    // Test connection
    let pool;
    try {
        pool = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'mysql' // Connect to mysql first to create DB
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const [result] = await pool.query(`
            CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        
        console.log('✅ Database created/verified: ' + process.env.DB_NAME);

        // Now connect to our database and run schema
        await pool.end();
        const dbPool = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to excel_importer_db');

        // Read and execute schema file
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, 'database/schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Executing database schema...');
        
        // Split SQL by semicolons and execute each statement
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            
            // Skip comments and empty lines
            if (statement.startsWith('--') || statement === '') continue;
            
            try {
                await dbPool.query(statement);
                console.log(`   ✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                // Some statements might fail due to duplicate keys, which is okay
                if (error.code !== 'ER_DUP_ENTRY' && !statement.includes('CREATE DATABASE') && 
                    !statement.includes('INSERT')) {
                    console.log(`   ⚠️  Statement ${i + 1} skipped: ${error.message}`);
                } else {
                    console.log(`   ✅ Statement ${i + 1} executed (duplicate or expected)`);
                }
            }
        }

        console.log('\n🎉 Database setup complete!');
        console.log('\nTables created:');
        const [tables] = await dbPool.query('SHOW TABLES;');
        tables.forEach(table => {
            console.log(`   - ${table.Table}`);
        });

    } catch (error) {
        console.error('\n❌ Database setup failed!');
        console.error('Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check if MySQL is running: sudo systemctl status mysql');
        console.error('2. Verify database credentials in .env file');
        console.error('3. Check MySQL logs: sudo tail -f /var/log/mysql/error.log');
        
        process.exit(1);
    } finally {
        if (pool) await pool.end();
    }
}

// Run setup
setupDatabase().catch(err => {
    console.error('\nFatal error:', err.message);
    process.exit(1);
});
