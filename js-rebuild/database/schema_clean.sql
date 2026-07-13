-- Excel Importer Database Schema - Clean Version for Node.js Execution
DROP TABLE IF EXISTS import_history;
DROP TABLE IF EXISTS import_mappings;
DROP TABLE IF EXISTS imports;
DROP TABLE IF EXISTS upload_files;

CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    import_id VARCHAR(255),
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
    INDEX idx_filename (filename),
    INDEX idx_import_id (import_id)
);

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
    FOREIGN KEY (connection_id) REFERENCES connections(id),
    INDEX idx_connection_id (connection_id),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date)
);

CREATE TABLE IF NOT EXISTS import_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    source_column VARCHAR(100),
    target_field VARCHAR(100),
    transformation VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    INDEX idx_import_id (import_id)
);

CREATE TABLE IF NOT EXISTS import_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id VARCHAR(255) NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    records_processed INT DEFAULT 0,
    status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    error_message TEXT,
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    INDEX idx_import_id (import_id),
    INDEX idx_started_at (started_at)
);

INSERT IGNORE INTO connections (id, server, host, port, database, username, password, created_at) VALUES
(1, 'Local MySQL Test Database', 'localhost', 3306, 'excel_importer_db', 'root', 'P@ssw0rd', NOW()),
(2, 'Production MSSQL Server', 'prod-server.example.com', 1433, 'production_db', 'sa', '', NOW());

INSERT IGNORE INTO imports (id, connection_id, file_name, file_size, columns_count, rows_count, status, created_at) VALUES
('test-import-001', 1, 'employees.csv', 556, 8, 5, 'completed', NOW() - INTERVAL 1 DAY),
('test-import-002', 1, 'customers.csv', 587, 9, 5, 'failed', NOW() - INTERVAL 2 DAYS);

INSERT IGNORE INTO import_mappings (import_id, source_column, target_field, transformation) VALUES
('test-import-001', 'Employee_ID', 'emp_id', NULL),
('test-import-001', 'Full_Name', 'full_name', NULL),
('test-import-001', 'Email', 'email_address', NULL);

INSERT IGNORE INTO import_history (import_id, started_at, completed_at, records_processed, status) VALUES
('test-import-001', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 5 MINUTES, 5, 'completed'),
('test-import-002', NOW() - INTERVAL 2 DAYS, NULL, 3, 'failed');

SELECT 'Schema created successfully!' AS status;
SHOW TABLES;
