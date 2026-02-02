import database from '../database/connection';
import { Ride, Driver } from '../types';

/**
 * Simple driver matching algorithm
 * Returns the nearest available driver to pickup location
 * For now, this is a dummy implementation that picks any available driver
 */
export async function matchDriverToRide(ride: Ride): Promise<Driver | null> {
  try {
    // Get available drivers (status = 'online')
    const query = `
      SELECT * FROM drivers 
      WHERE status = 'online'
      ORDER BY RANDOM()
      LIMIT 1;
    `;

    const result = await database.query<Driver>(query, []);

    if (result.rows.length === 0) {
      console.log('No available drivers found for ride:', ride.id);
      return null;
    }

    const driver = result.rows[0];
    console.log(`Matched driver ${driver.id} to ride ${ride.id}`);
    
    return driver;
  } catch (error) {
    console.error('Error matching driver to ride:', error);
    return null;
  }
}

/**
 * Assign a driver to a ride
 * Updates ride with driver_id and changes driver status to on_trip
 */
export async function assignDriverToRide(
  rideId: string,
  driverId: string
): Promise<Ride | null> {
  const client = await database.getClient();

  try {
    await client.query('BEGIN');

    // Update ride with driver assignment
    const updateRideQuery = `
      UPDATE rides 
      SET driver_id = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING *;
    `;

    const rideResult = await client.query(updateRideQuery, [driverId, rideId]);

    if (rideResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log('Ride not found or not in pending status');
      return null;
    }

    // Update driver status to on_trip
    const updateDriverQuery = `
      UPDATE drivers 
      SET status = 'on_trip', updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const driverResult = await client.query(updateDriverQuery, [driverId]);

    if (driverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log('Driver not found');
      return null;
    }

    await client.query('COMMIT');

    const ride = rideResult.rows[0];
    console.log(`Successfully assigned driver ${driverId} to ride ${rideId}`);

    return ride;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning driver to ride:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Get nearest available driver based on current location
 * This is a more advanced version that can be implemented later
 * For now, we just get any available driver
 */
export async function getNearestDriver(
  pickupLat: number,
  pickupLng: number
): Promise<Driver | null> {
  try {
    // Get all available drivers with their current location
    const query = `
      SELECT * FROM drivers 
      WHERE status = 'online'
      ORDER BY RANDOM()
      LIMIT 1;
    `;

    const result = await database.query<Driver>(query, []);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting nearest driver:', error);
    return null;
  }
}
