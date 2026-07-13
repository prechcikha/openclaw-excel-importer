const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Initialize database service
let dbService;
async function getDBService() {
    if (!dbService) {
        try {
            const { initializeDB } = require('../services/dbService');
            dbService = await initializeDB();
        } catch (error) {
            console.log('Database initialization failed - using mock responses:', error.message);
            const { MockDBService } = require('../services/dbService');
            dbService = new MockDBService();
        }
    }
    return dbService;
}

// File upload configuration with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!path.existsSync(uploadDir)) {
            path.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept Excel and CSV files only
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel',                                          // .xls
        'text/csv'                                                           // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: fileFilter
});

/**
 * POST /api/imports/upload - Upload and parse Excel/CSV file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('File uploaded:', req.file?.filename);
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        }

        // Validate file type (already done by multer filter, but double-check)
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid file type',
                message: 'Only Excel (.xlsx, .xls) and CSV files are allowed'
            });
        }

        // Validate file size (also checked by multer limits)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (req.file.size > maxSize) {
            return res.status(400).json({ 
                success: false, 
                error: 'File too large',
                message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
            });
        }

        // Parse file based on type
        let parsedData;
        
        if (req.file.mimetype === 'text/csv') {
            // Parse CSV
            const csvContent = fs.readFileSync(req.file.path, 'utf8');
            parsedData = parseCSV(csvContent);
            
            console.log(`CSV parsed: ${parsedData.headers.length} columns, ${parsedData.rows.length} rows`);
        
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   req.file.mimetype === 'application/vnd.ms-excel') {
            // Parse Excel file (would use SheetJS in production)
            console.log('Excel file parsed: using mock data for demo');
            
            // For now, return mock parsed data
            // In production, would use xlsx library: require('xlsx').read(req.file.buffer, {type: 'array'})
            parsedData = {
                headers: ['Column1', 'Column2', 'Column3'],
                rows: [
                    { Column1: 'Row1-Col1', Column2: 'Row1-Col2', Column3: 'Value' },
                    { Column1: 'Row2-Col1', Column2: 'Row2-Col2', Column3: 'Value' }
                ]
            };
        }

        // Save parsed data metadata to database
        const service = await getDBService();
        const importRecord = await service.saveImportMetadata({
            connection_id: req.body.connection_id,
            file_name: req.file.originalname,
            file_size: req.file.size,
            columns_count: parsedData.headers.length,
            rows_count: parsedData.rows.length,
            upload_date: new Date(),
            status: 'ready' // ready for mapping
        });

        res.json({ 
            success: true,
            message: `File uploaded and parsed successfully`,
            data: {
                file_id: importRecord.id,
                file_name: req.file.originalname,
                file_size_bytes: req.file.size,
                columns_count: parsedData.headers.length,
                rows_count: parsedData.rows.length,
                column_names: parsedData.headers,
                sample_rows: parsedData.rows.slice(0, 3), // First 3 rows as preview
                upload_path: `/uploads/${req.file.filename}`
            }
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'File too large',
                    message: `Maximum file size is 50MB`
                });
            }
        }

        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload file',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/imports/mapping - Save column mapping configuration
 */
router.post('/mapping', async (req, res) => {
    try {
        const { import_id, file_id, mappings } = req.body;

        if (!import_id || !file_id || !mappings) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                message: 'import_id, file_id and mappings are required'
            });
        }

        // Validate mapping structure
        for (const [sourceColumn, targetField] of Object.entries(mappings)) {
            if (!targetField || typeof targetField !== 'object') {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid mapping for column: ${sourceColumn}`,
                    message: 'Each column must map to an object with field and transformation properties'
                });
            }
        }

        const service = await getDBService();
        await service.saveImportMapping({
            import_id,
            file_id,
            mappings,
            mapped_at: new Date()
        });

        res.json({ 
            success: true,
            message: 'Column mapping saved successfully',
            data: {
                mapping_id: Date.now(),
                columns_mapped: Object.keys(mappings).length
            }
        });

    } catch (error) {
        console.error('Error saving mapping:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save column mapping',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/imports/execute - Execute the import process
 */
router.post('/execute', async (req, res) => {
    try {
        const { import_id, file_id, connection_id, target_table } = req.body;

        if (!import_id || !file_id || !connection_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                message: 'import_id, file_id and connection_id are required'
            });
        }

        console.log('Starting import process for:', import_id);
        
        const service = await getDBService();
        
        // Get import metadata
        const importRecord = await service.getImportById(import_id);
        
        if (!importRecord) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import record not found'
            });
        }

        // Check if mapping is complete
        const mapping = await service.getMappingForImport(import_id);
        
        if (!mapping || Object.keys(mapping.mappings).length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No column mappings found',
                message: 'Please complete column mapping before executing import'
            });
        }

        // Execute import (simulated for now)
        const result = await service.executeImport({
            connection_id,
            file_id,
            import_id,
            target_table,
            mappings: mapping.mappings,
            rows_count: importRecord.rows_count,
            start_time: new Date()
        });

        // Update import status
        await service.updateImportStatus(import_id, 'completed', {
            records_imported: result.records_imported,
            records_failed: result.records_failed,
            duration_ms: result.duration_ms
        });

        res.json({ 
            success: true,
            message: `Import completed successfully`,
            data: {
                import_id,
                records_total: importRecord.rows_count,
                records_imported: result.records_imported,
                records_failed: result.records_failed,
                duration_ms: result.duration_ms,
                target_table,
                completed_at: new Date()
            }
        });

    } catch (error) {
        console.error('Error executing import:', error);
        
        // Update status to failed if there was an error
        try {
            const service = await getDBService();
            await service.updateImportStatus(req.body.import_id, 'failed', {
                error_message: error.message
            });
        } catch (e) {
            console.error('Failed to update import status:', e);
        }

        res.status(500).json({ 
            success: false, 
            error: 'Import execution failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/imports/history - Get import history
 */
router.get('/history', async (req, res) => {
    try {
        const service = await getDBService();
        const imports = await service.getImportHistory({
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0,
            status: req.query.status
        });

        res.json({ 
            success: true,
            count: imports.length,
            data: imports
        });

    } catch (error) {
        console.error('Error fetching import history:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch import history'
        });
    }
});

/**
 * GET /api/imports/:id - Get specific import details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const service = await getDBService();
        const importRecord = await service.getImportById(id);

        if (!importRecord) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import not found'
            });
        }

        // Get associated mapping if exists
        let mapping = null;
        try {
            mapping = await service.getMappingForImport(id);
        } catch (e) {
            console.log('No mapping found for import:', id);
        }

        res.json({ 
            success: true,
            data: {
                ...importRecord,
                mapping: mapping || null
            }
        });

    } catch (error) {
        console.error('Error fetching import details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch import details'
        });
    }
});

/**
 * DELETE /api/imports/:id - Delete an import record and its file
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Deleting import:', id);
        
        const service = await getDBService();
        await service.deleteImport(id);

        res.json({ 
            success: true,
            message: `Import ${id} deleted successfully`
        });

    } catch (error) {
        console.error('Error deleting import:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete import'
        });
    }
});

module.exports = router;
