-- Excel to MSSQL Importer Database Schema
CREATE DATABASE IF NOT EXISTS excel_importer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE excel_importer_db;

-- Table: Connections
CREATE TABLE IF NOT EXISTS connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT DEFAULT 1433,
    target_database VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    trusted_connection BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Import History
CREATE TABLE IF NOT EXISTS import_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type VARCHAR(50) NOT NULL,
    total_rows INT DEFAULT 0,
    imported_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Column Mappings
CREATE TABLE IF NOT EXISTS column_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL,
    excel_column VARCHAR(255) NOT NULL,
    db_column VARCHAR(255) NOT NULL,
    data_type ENUM('string', 'number', 'date', 'datetime', 'boolean', 'decimal') DEFAULT 'string',
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE,
    UNIQUE KEY unique_import_column (import_id, excel_column)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Import Logs
CREATE TABLE IF NOT EXISTS import_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL,
    row_num INT DEFAULT 0,
    excel_data TEXT NOT NULL,
    imported_json TEXT,
    stat_status ENUM('success', 'skipped', 'failed') NOT NULL,
    error_message TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO connections (name, host, target_database, username, password) 
VALUES ('Test Local MSSQL', 'localhost', 'tempdb', 'sa', '')
ON DUPLICATE KEY UPDATE name='Test Local MSSQL';

SELECT 'Database setup complete!' as status;
SHOW TABLES;
