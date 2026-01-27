import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../database/connection';
import { Driver, DriverLocation } from '../types';

const driversRouter = Router();

/**
 * POST /v1/drivers/:id/location - Send driver location updates
 * Request body: { latitude, longitude }
 */
driversRouter.post('/:id/location', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    // Validate required fields
    if (!id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: driver_id, latitude, longitude',
      });
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude',
      });
    }

    const location_id = uuidv4();
    const now = new Date();

    // Insert location update and update driver's current location atomically
    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Insert into driver_locations
      const insertQuery = `
        INSERT INTO driver_locations (id, driver_id, latitude, longitude, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const insertResult = await client.query(insertQuery, [
        location_id,
        id,
        latitude,
        longitude,
        now,
      ]);

      // Update driver's current location
      const updateQuery = `
        UPDATE drivers 
        SET current_location = jsonb_build_object('latitude', $2, 'longitude', $3),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      const updateResult = await client.query<Driver>(updateQuery, [id, latitude, longitude]);

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      await client.query('COMMIT');

      const driver = updateResult.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          ...driver,
          current_location:
            driver.current_location && typeof driver.current_location === 'string'
              ? JSON.parse(driver.current_location)
              : driver.current_location,
        },
        message: 'Location updated successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating driver location:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /v1/drivers/:id/accept - Accept ride assignment
 * Request body: { ride_id }
 */
driversRouter.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ride_id } = req.body;

    if (!id || !ride_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: driver_id, ride_id',
      });
    }

    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Update ride status to accepted and assign driver
      const updateRideQuery = `
        UPDATE rides 
        SET driver_id = $1, status = 'accepted', updated_at = NOW()
        WHERE id = $2 AND status = 'pending'
        RETURNING *;
      `;

      const rideResult = await client.query(updateRideQuery, [id, ride_id]);

      if (rideResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Ride not found or already accepted',
        });
      }

      // Update driver status to on_trip
      const updateDriverQuery = `
        UPDATE drivers 
        SET status = 'on_trip', updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      const driverResult = await client.query<Driver>(updateDriverQuery, [id]);

      if (driverResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      await client.query('COMMIT');

      const driver = driverResult.rows[0];
      const ride = rideResult.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          driver: {
            ...driver,
            current_location:
              driver.current_location && typeof driver.current_location === 'string'
                ? JSON.parse(driver.current_location)
                : driver.current_location,
          },
          ride: {
            ...ride,
            pickup_location: JSON.parse(ride.pickup_location),
            dropoff_location: JSON.parse(ride.dropoff_location),
          },
        },
        message: 'Ride accepted successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error accepting ride:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /v1/drivers/:id - Get driver details
 */
driversRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID is required',
      });
    }

    const query = `
      SELECT * FROM drivers WHERE id = $1;
    `;

    const driver = await database.queryOne<Driver>(query, [id]);

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...driver,
        current_location:
          driver.current_location && typeof driver.current_location === 'string'
            ? JSON.parse(driver.current_location)
            : driver.current_location,
      },
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default driversRouter;
