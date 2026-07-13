const express = require('express');
const router = express.Router();

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

/**
 * GET /api/imports/:importId/mappings - Get column mappings for an import job
 */
router.get('/:importId/mappings', async (req, res) => {
    try {
        const { importId } = req.params;
        
        console.log('Fetching column mappings for import:', importId);
        
        const service = await getDBService();
        
        if (typeof service.getColumnMappings === 'function') {
            // Real database query
            const mappings = await service.getColumnMappings(parseInt(importId));
            
            return res.json({ 
                success: true, 
                data: mappings || []
            });
        }

        // Mock response for development without DB
        res.json({ 
            success: true, 
            data: []
        });

    } catch (error) {
        console.error('Error fetching mappings:', error);
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch column mappings'
        });
    }
});

/**
 * POST /api/imports/:importId/mappings - Save column mappings for an import job
 */
router.post('/:importId/mappings', async (req, res) => {
    try {
        const { importId } = req.params;
        const { mappings } = req.body;

        if (!mappings || !Array.isArray(mappings)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Mappings must be an array'
            });
        }

        console.log('Saving column mappings for import:', importId);
        
        const service = await getDBService();
        
        if (typeof service.saveColumnMappings === 'function') {
            // Real database save
            await service.saveColumnMappings(parseInt(importId), mappings);
            
            return res.json({ 
                success: true, 
                message: `Saved ${mappings.length} column mappings`,
                data: mappings
            });
        }

        // Mock save for development
        const savedMappings = mappings.map(m => ({...m, id: Date.now() + Math.random()}));
        
        res.status(201).json({ 
            success: true, 
            message: `Saved ${savedMappings.length} column mappings`,
            data: savedMappings
        });

    } catch (error) {
        console.error('Error saving mappings:', error);
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save column mappings'
        });
    }
});

module.exports = router;
