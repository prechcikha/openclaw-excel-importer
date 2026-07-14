-- Migration: Add imports and import_logs tables if missing
USE excel_importer_db;

-- Check if imports table exists and create it if not
CREATE TABLE IF NOT EXISTS imports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    connection_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    columns_count INT DEFAULT 0,
    rows_count INT DEFAULT 0,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ready', 'mapping_in_progress', 'importing', 'completed', 'failed') NOT NULL DEFAULT 'ready',
    error_message TEXT,
    records_imported INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_connection_id (connection_id),
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check if import_logs table exists and create it if not (using TEXT instead of JSON for compatibility)
CREATE TABLE IF NOT EXISTS import_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL,
    row_number INT DEFAULT 0,
    excel_data TEXT NOT NULL,
    imported_json TEXT,
    status ENUM('success', 'skipped', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_processed_at (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample test connection if it doesn't exist
INSERT INTO connections (name, host, port, target_database, username, password, trusted_connection) 
SELECT 'Test Local MySQL', 'localhost', 3306, 'excel_importer_db', 'root', '', 0
WHERE NOT EXISTS (SELECT 1 FROM connections WHERE name = 'Test Local MySQL');

-- Verify tables created
SHOW TABLES;

SELECT 'Migration completed successfully!' as status;
