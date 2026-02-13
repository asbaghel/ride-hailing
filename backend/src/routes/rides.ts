import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../database/connection';
import { Ride } from '../types';
import { matchDriverToRide, assignDriverToRide } from '../services/driverMatching';

const ridesRouter = Router();

/**
 * POST /v1/rides - Create a new ride request
 * Request body: { user_id, pickup_location, dropoff_location, estimated_fare? }
 */
ridesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, pickup_location, dropoff_location, estimated_fare } = req.body;

    // Validate required fields
    if (!user_id || !pickup_location || !dropoff_location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, pickup_location, dropoff_location',
      });
    }

    const ride_id = uuidv4();
    const status = 'pending';
    const now = new Date();

    const query = `
      INSERT INTO rides (
        id, user_id, pickup_location, dropoff_location, 
        status, estimated_fare, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const params = [
      ride_id,
      user_id,
      JSON.stringify(pickup_location),
      JSON.stringify(dropoff_location),
      status,
      estimated_fare || null,
      now,
      now,
    ];

    const result = await database.query<Ride>(query, params);

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create ride',
      });
    }

    const ride = result.rows[0];

    // Attempt to match and assign a driver
    const matchedDriver = await matchDriverToRide(ride);
    if (matchedDriver) {
      const assignedRide = await assignDriverToRide(ride.id, matchedDriver.id);
      if (assignedRide) {
        // Parse locations if they're strings
        const pickupLocation = typeof assignedRide.pickup_location === 'string' 
          ? JSON.parse(assignedRide.pickup_location) 
          : assignedRide.pickup_location;
        const dropoffLocation = typeof assignedRide.dropoff_location === 'string'
          ? JSON.parse(assignedRide.dropoff_location)
          : assignedRide.dropoff_location;

        return res.status(201).json({
          success: true,
          data: {
            ...assignedRide,
            pickup_location: pickupLocation,
            dropoff_location: dropoffLocation,
          },
          message: 'Ride created successfully and driver assigned',
        });
      }
    }

    // If no driver found, return ride with pending status
    const pickupLocation = typeof ride.pickup_location === 'string'
      ? JSON.parse(ride.pickup_location)
      : ride.pickup_location;
    const dropoffLocation = typeof ride.dropoff_location === 'string'
      ? JSON.parse(ride.dropoff_location)
      : ride.dropoff_location;

    return res.status(201).json({
      success: true,
      data: {
        ...ride,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
      },
      message: 'Ride created successfully. Searching for drivers...',
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /v1/rides/:id - Get ride status
 */
ridesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Ride ID is required',
      });
    }

    const query = `
      SELECT * FROM rides WHERE id = $1;
    `;

    const ride = await database.queryOne<Ride>(query, [id]);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found',
      });
    }

    // Parse locations if they're strings
    const pickupLocation = typeof ride.pickup_location === 'string'
      ? JSON.parse(ride.pickup_location)
      : ride.pickup_location;
    const dropoffLocation = typeof ride.dropoff_location === 'string'
      ? JSON.parse(ride.dropoff_location)
      : ride.dropoff_location;

    return res.status(200).json({
      success: true,
      data: {
        ...ride,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
      },
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /v1/rides/:id - Update ride status (for demo/driver app)
 * Request body: { status: 'assigned' | 'in_progress' | 'completed' }
 */
ridesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Ride ID is required',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const query = `
      UPDATE rides 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const ride = await database.queryOne<Ride>(query, [status, id]);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found',
      });
    }

    // Parse locations if they're strings
    const pickupLocation = typeof ride.pickup_location === 'string'
      ? JSON.parse(ride.pickup_location)
      : ride.pickup_location;
    const dropoffLocation = typeof ride.dropoff_location === 'string'
      ? JSON.parse(ride.dropoff_location)
      : ride.dropoff_location;

    console.log(`✅ Ride ${id} status updated to: ${status}`);

    return res.status(200).json({
      success: true,
      data: {
        ...ride,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
      },
      message: `Ride status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /v1/rides/:id/cancel - Cancel a ride
 */
ridesRouter.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Ride ID is required',
      });
    }

    const query = `
      UPDATE rides 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND status != 'completed'
      RETURNING *;
    `;

    const ride = await database.queryOne<Ride>(query, [id]);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or already completed',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...ride,
        pickup_location: JSON.parse(ride.pickup_location as any),
        dropoff_location: JSON.parse(ride.dropoff_location as any),
      },
      message: 'Ride cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default ridesRouter;
