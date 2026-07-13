-- Excel Importer Database Schema
-- Created: 2026-07-13
-- Version: 1.0

USE excel_importer_db;

-- Drop tables if they exist (for clean installation)
DROP TABLE IF EXISTS import_history;
DROP TABLE IF EXISTS import_mappings;
DROP TABLE IF EXISTS imports;

-- ============================================================================
-- Table: imports
-- Description: Stores metadata about uploaded files and import jobs
-- ============================================================================
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
    
    -- Foreign key constraint
    FOREIGN KEY (connection_id) REFERENCES connections(id),
    
    -- Indexes for performance
    INDEX idx_connection_id (connection_id),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Table: import_mappings
-- Description: Stores column mapping configuration for each import
-- ============================================================================
CREATE TABLE IF NOT EXISTS import_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    source_column VARCHAR(100),
    target_field VARCHAR(100),
    transformation VARCHAR(200),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key with cascade delete
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    
    -- Index for quick lookup
    INDEX idx_import_id (import_id),
    INDEX idx_source_column (source_column)
);

-- ============================================================================
-- Table: import_history
-- Description: Tracks execution history of each import attempt
-- ============================================================================
CREATE TABLE IF NOT EXISTS import_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    
    -- Execution timestamps
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    
    -- Statistics
    records_processed INT DEFAULT 0,
    status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    error_message TEXT,
    
    -- Foreign key with cascade delete
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    
    -- Indexes for querying history
    INDEX idx_import_id (import_id),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
);

-- ============================================================================
-- Table: upload_files
-- Description: Tracks uploaded files in the filesystem
-- ============================================================================
CREATE TABLE IF NOT EXISTS upload_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    import_id VARCHAR(255),
    
    -- Foreign key (optional - can be deleted independently)
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
    
    -- Index for file lookups
    INDEX idx_filename (filename),
    INDEX idx_import_id (import_id)
);

-- ============================================================================
-- Sample Data: Insert test connections if none exist
-- ============================================================================
INSERT IGNORE INTO connections (id, server, host, port, database, username, password, created_at) VALUES
(1, 'Local MySQL Test Database', 'localhost', 3306, 'excel_importer_db', 'root', 'P@ssw0rd', NOW()),
(2, 'Production MSSQL Server', 'prod-server.example.com', 1433, 'production_db', 'sa', '', NOW());

-- ============================================================================
-- Sample Data: Insert test import records (for demonstration)
-- ============================================================================
INSERT IGNORE INTO imports (id, connection_id, file_name, file_size, columns_count, rows_count, status, created_at) VALUES
('test-import-001', 1, 'employees.csv', 556, 8, 5, 'completed', NOW() - INTERVAL 1 DAY),
('test-import-002', 1, 'customers.csv', 587, 9, 5, 'failed', NOW() - INTERVAL 2 DAYS);

-- ============================================================================
-- Sample Data: Insert test mappings
-- ============================================================================
INSERT IGNORE INTO import_mappings (import_id, source_column, target_field, transformation) VALUES
('test-import-001', 'Employee_ID', 'emp_id', NULL),
('test-import-001', 'Full_Name', 'full_name', NULL),
('test-import-001', 'Email', 'email_address', NULL),
('test-import-001', 'Department', 'department', NULL);

-- ============================================================================
-- Sample Data: Insert test history records
-- ============================================================================
INSERT IGNORE INTO import_history (import_id, started_at, completed_at, records_processed, status) VALUES
('test-import-001', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 5 MINUTES, 5, 'completed'),
('test-import-002', NOW() - INTERVAL 2 DAYS, NULL, 3, 'failed');

-- ============================================================================
-- Create a view for easy import statistics
-- ============================================================================
CREATE OR REPLACE VIEW v_import_statistics AS
SELECT 
    i.id as import_id,
    i.file_name,
    i.status as import_status,
    COUNT(im.id) as columns_mapped,
    COALESCE(SUM(CASE WHEN ih.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_attempts,
    COALESCE(SUM(CASE WHEN ih.status = 'failed' THEN 1 ELSE 0 END), 0) as failed_attempts,
    MAX(ih.completed_at) as last_attempted_at
FROM imports i
LEFT JOIN import_mappings im ON i.id = im.import_id
LEFT JOIN import_history ih ON i.id = ih.import_id
GROUP BY i.id;

-- ============================================================================
-- Verify schema creation
-- ============================================================================
SELECT 'Schema created successfully!' AS status;
SHOW TABLES;
DESCRIBE imports;
DESCRIBE import_mappings;
DESCRIBE import_history;
DESCRIBE upload_files;
