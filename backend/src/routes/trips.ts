import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../database/connection';
import { Trip, Ride } from '../types';

const tripsRouter = Router();

/**
 * POST /v1/trips/:id/end - End trip and trigger fare calculation
 * Request body: { distance_km, duration_minutes }
 */
tripsRouter.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { distance_km, duration_minutes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required',
      });
    }

    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Get the trip first
      const getTripQuery = `SELECT * FROM trips WHERE id = $1;`;
      const tripResult = await client.query(getTripQuery, [id]);

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Trip not found',
        });
      }

      const trip = tripResult.rows[0] as Trip;

      // Calculate fare: base_fare + (distance * per_km_rate) + (duration * per_minute_rate)
      const BASE_FARE = 2.5;
      const PER_KM_RATE = 1.5;
      const PER_MINUTE_RATE = 0.25;

      const calculated_fare =
        BASE_FARE +
        (distance_km || 0) * PER_KM_RATE +
        (duration_minutes || 0) * PER_MINUTE_RATE;

      // Update trip with calculated fare
      const updateTripQuery = `
        UPDATE trips 
        SET distance_km = $2, 
            duration_minutes = $3,
            fare = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      const updatedTripResult = await client.query(updateTripQuery, [
        id,
        distance_km || 0,
        duration_minutes || 0,
        calculated_fare,
      ]);

      if (updatedTripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(500).json({
          success: false,
          error: 'Failed to update trip',
        });
      }

      const updatedTrip = updatedTripResult.rows[0] as Trip;

      // Update ride to completed
      const updateRideQuery = `
        UPDATE rides 
        SET status = 'completed', 
            actual_fare = $2,
            ended_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status = 'in_progress'
        RETURNING *;
      `;

      const updatedRideResult = await client.query(updateRideQuery, [
        trip.ride_id,
        calculated_fare,
      ]);

      if (updatedRideResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Associated ride not found or not in progress',
        });
      }

      const updatedRide = updatedRideResult.rows[0] as Ride;

      // Update driver status back to online
      const updateDriverQuery = `
        UPDATE drivers 
        SET status = 'online', updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      await client.query(updateDriverQuery, [trip.driver_id]);

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        data: {
          trip: updatedTrip,
          ride: {
            ...updatedRide,
            pickup_location: 
              typeof updatedRide.pickup_location === 'string'
                ? JSON.parse(updatedRide.pickup_location)
                : updatedRide.pickup_location,
            dropoff_location:
              typeof updatedRide.dropoff_location === 'string'
                ? JSON.parse(updatedRide.dropoff_location)
                : updatedRide.dropoff_location,
          },
        },
        message: 'Trip ended and fare calculated successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error ending trip:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /v1/trips/:id - Get trip details
 */
tripsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required',
      });
    }

    const query = `
      SELECT * FROM trips WHERE id = $1;
    `;

    const trip = await database.queryOne<Trip>(query, [id]);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default tripsRouter;
