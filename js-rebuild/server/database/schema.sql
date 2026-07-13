-- Excel to MSSQL Importer Database Schema
-- Creates all necessary tables for connections, imports, and column mappings

CREATE DATABASE IF NOT EXISTS excel_importer_db;
USE excel_importer_db;

-- Table: Connections
-- Stores remote MSSQL server connection configurations
CREATE TABLE IF NOT EXISTS connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'Friendly name for the connection',
    host VARCHAR(255) NOT NULL COMMENT 'MSSQL server hostname or IP',
    port INT DEFAULT 1433 COMMENT 'MSSQL server port',
    database VARCHAR(255) NOT NULL COMMENT 'Target MSSQL database name',
    username VARCHAR(255) NOT NULL COMMENT 'MSSQL username for authentication',
    password TEXT NOT NULL COMMENT 'MSSQL password (encrypted in production)',
    trusted_connection BOOLEAN DEFAULT FALSE COMMENT 'Use Windows Authentication?',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_host (host)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Imports
-- Stores metadata for file uploads before import execution
CREATE TABLE IF NOT EXISTS imports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL COMMENT 'Foreign key to connections table',
    file_name VARCHAR(255) NOT NULL COMMENT 'Original uploaded filename',
    file_size BIGINT DEFAULT 0 COMMENT 'File size in bytes',
    columns_count INT DEFAULT 0 COMMENT 'Number of columns detected',
    rows_count INT DEFAULT 0 COMMENT 'Total rows in the file',
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When file was uploaded',
    status ENUM('ready', 'mapping_in_progress', 'importing', 'completed', 'failed') NOT NULL DEFAULT 'ready' COMMENT 'Current import state',
    error_message TEXT COMMENT 'Error details if import failed',
    records_imported INT DEFAULT 0 COMMENT 'Number of successfully imported rows',
    records_failed INT DEFAULT 0 COMMENT 'Number of failed rows',
    duration_ms INT DEFAULT 0 COMMENT 'Import duration in milliseconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_connection_id (connection_id),
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Import History  
-- Tracks all import jobs with their status and progress
CREATE TABLE IF NOT EXISTS import_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL COMMENT 'Foreign key to connections table',
    file_name VARCHAR(500) NOT NULL COMMENT 'Original uploaded filename',
    file_size BIGINT DEFAULT 0 COMMENT 'File size in bytes',
    file_type VARCHAR(50) NOT NULL COMMENT 'application/vnd.openxmlformats... or text/csv',
    total_rows INT DEFAULT 0 COMMENT 'Total rows found in file',
    imported_count INT DEFAULT 0 COMMENT 'Successfully imported rows',
    failed_count INT DEFAULT 0 COMMENT 'Rows that failed to import',
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    error_message TEXT COMMENT 'Error details if import failed',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_connection_id (connection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Column Mappings
-- Maps Excel/CSV columns to MSSQL table columns for each import job
CREATE TABLE IF NOT EXISTS column_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL COMMENT 'Foreign key to import_history.id',
    excel_column VARCHAR(255) NOT NULL COMMENT 'Source column from Excel/CSV file',
    db_column VARCHAR(255) NOT NULL COMMENT 'Target column in MSSQL table',
    data_type ENUM('string', 'number', 'date', 'datetime', 'boolean', 'decimal') DEFAULT 'string' COMMENT 'Data type for validation',
    is_required BOOLEAN DEFAULT FALSE COMMENT 'Is this field required?',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE,
    UNIQUE KEY unique_import_column (import_id, excel_column),
    INDEX idx_excel_column (excel_column)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Import Logs
-- Detailed log of each row import for debugging and audit purposes
CREATE TABLE IF NOT EXISTS import_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL COMMENT 'Foreign key to import_history.id',
    row_number INT DEFAULT 0 COMMENT 'Row number in the file (1-based)',
    excel_data JSON NOT NULL COMMENT 'Original data from Excel/CSV row as JSON',
    imported_json JSON COMMENT 'Data after mapping and transformation',
    status ENUM('success', 'skipped', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT COMMENT 'Error details if import failed',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_processed_at (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a sample connection for testing (password set to empty, should be changed in production)
INSERT INTO connections (name, host, database, username, password) 
VALUES ('Test Local MSSQL', 'localhost', 'tempdb', 'sa', '')
ON DUPLICATE KEY UPDATE name='Test Local MSSQL';

-- Insert a sample import record for testing
INSERT INTO imports (file_name, file_size, columns_count, rows_count, status) 
VALUES ('sample_data.xlsx', 0, 5, 10, 'pending')
ON DUPLICATE KEY UPDATE file_name='sample_data.xlsx';

-- Insert a sample import history record for testing
INSERT INTO import_history (connection_id, file_name, file_size, file_type, total_rows, status) 
VALUES (1, 'sample_data.xlsx', 0, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 0, 'pending')
ON DUPLICATE KEY UPDATE file_name='sample_data.xlsx';

-- Output success message
SELECT 'Database schema created successfully!' as status;
SELECT 'Tables created: connections, import_history, column_mappings, import_logs' as tables;
SELECT 'Sample data inserted for testing purposes' as samples;
