import database from '../database/connection';
import { Ride, Driver, Location } from '../types';
import {
  selectBestDriver,
  scoreDrivers,
  ScoredDriver,
  DEFAULT_MATCHING_CONFIG,
  MatchingConfig,
} from './matchingAlgorithm';

/**
 * Match a driver to a ride using the scoring algorithm
 * Fetches available drivers and selects the best one
 */
export async function matchDriverToRide(
  ride: Ride,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): Promise<Driver | null> {
  try {
    // Get all available drivers (status = 'online')
    const query = `
      SELECT * FROM drivers 
      WHERE status = 'online'
      ORDER BY updated_at DESC;
    `;

    const result = await database.query<Driver>(query, []);

    if (result.rows.length === 0) {
      console.log('No available drivers found for ride:', ride.id);
      return null;
    }

    // Select best driver using scoring algorithm
    const bestDriver = selectBestDriver(result.rows, ride.pickup_location, config);

    if (bestDriver) {
      console.log(`Matched driver ${bestDriver.id} to ride ${ride.id}`);
    }

    return bestDriver;
  } catch (error) {
    console.error('Error matching driver to ride:', error);
    return null;
  }
}

/**
 * Get top N candidate drivers for a ride (for display or fallback logic)
 */
export async function getTopCandidateDrivers(
  ride: Ride,
  topN: number = 5,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): Promise<ScoredDriver[]> {
  try {
    const query = `
      SELECT * FROM drivers 
      WHERE status = 'online'
      ORDER BY updated_at DESC;
    `;

    const result = await database.query<Driver>(query, []);

    if (result.rows.length === 0) {
      return [];
    }

    const scored = scoreDrivers(result.rows, ride.pickup_location, config);
    return scored.slice(0, Math.min(topN, scored.length));
  } catch (error) {
    console.error('Error getting candidate drivers:', error);
    return [];
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

