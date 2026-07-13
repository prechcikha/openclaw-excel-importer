#!/bin/bash

echo "=========================================================================="
echo "EXCEL IMPORTER - DATABASE SETUP"
echo "=========================================================================="

DB_NAME="excel_importer_db"
SCHEMA_FILE="/home/openclaw/.openclaw/workspace/excel-importer/js-rebuild/database/schema.sql"

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "Starting MySQL service..."
    sudo systemctl start mysql
fi

sleep 2

echo ""
echo "Attempting to connect to MySQL as root (socket authentication)..."

# Try socket-based auth first
mysql -u root < "$SCHEMA_FILE" 2>&1 | head -30

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================================================="
    echo "✅ DATABASE SETUP COMPLETED SUCCESSFULLY!"
    echo "=========================================================================="
    
    # Verify tables
    echo ""
    echo "Verifying tables created:"
    mysql -u root -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
    
    echo ""
    echo "Sample data inserted successfully!"
else
    echo ""
    echo "=========================================================================="
    echo "⚠️  DATABASE SETUP INCOMPLETE"
    echo "=========================================================================="
    echo ""
    echo "MySQL connection failed. Possible issues:"
    echo "1. MySQL/MariaDB is not running - start it with: sudo systemctl start mysql"
    echo "2. Authentication method issue - try modifying my.cnf for socket auth"
    echo "3. Database permissions - check user privileges"
    echo ""
    echo "Alternative: Create a .env file and run the Node.js setup script instead."
fi
