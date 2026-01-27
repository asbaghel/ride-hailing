import express, { Request, Response, Router } from 'express';
import locationService from '../services/locationService';

const router: Router = express.Router();

/**
 * POST /v1/locations/search
 * Search for locations by query string
 * Query params: q (query), limit (optional, default 3)
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = 3 } = req.body;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    console.log(`[LOCATION] Search request: ${q} (limit: ${limit})`);
    
    const results = await locationService.searchLocations(q, Math.min(limit, 10));

    console.log(`[LOCATION] Search completed: ${results.length} results found`);
    
    return res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('[LOCATION] Search error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search locations',
    });
  }
});

/**
 * POST /v1/locations/reverse
 * Reverse geocode coordinates to get address
 * Body: { latitude, longitude }
 */
router.post('/reverse', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude are required',
      });
    }

    console.log(`[LOCATION] Reverse geocode request: ${latitude}, ${longitude}`);
    
    const address = await locationService.reverseGeocode(latitude, longitude);

    console.log(`[LOCATION] Reverse geocode completed: ${address}`);
    
    return res.json({
      success: true,
      data: {
        address,
        latitude,
        longitude,
      },
    });
  } catch (error) {
    console.error('[LOCATION] Reverse geocode error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reverse geocode location',
    });
  }
});

export default router;
