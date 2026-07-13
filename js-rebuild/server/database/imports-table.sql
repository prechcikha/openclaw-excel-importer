-- Table: imports
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

-- Insert sample import record for testing
INSERT INTO imports (file_name, file_size, columns_count, rows_count, status) 
VALUES ('sample_data.xlsx', 0, 5, 10, 'pending')
ON DUPLICATE KEY UPDATE file_name='sample_data.xlsx';
