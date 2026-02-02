/**
 * Database Seed Script
 * Populates the database with dummy drivers for testing
 */

import database from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const DUMMY_DRIVERS = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@rideapp.com',
    phone: '+91-9876543210',
    vehicle_number: 'DL-01-AB-1234',
    vehicle_type: 'economy',
    rating: 4.8,
    total_rides: 524,
    cancellation_rate: 0.02,
    idle_time_seconds: 600,
    estimated_pickup_time_seconds: 240,
    surge_zone_priority: 1.0,
    current_location: { latitude: 28.6139, longitude: 77.209 }, // Delhi
    status: 'online' as const,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@rideapp.com',
    phone: '+91-9876543211',
    vehicle_number: 'DL-02-CD-5678',
    vehicle_type: 'premium',
    rating: 4.9,
    total_rides: 812,
    cancellation_rate: 0.01,
    idle_time_seconds: 300,
    estimated_pickup_time_seconds: 180,
    surge_zone_priority: 1.5,
    current_location: { latitude: 28.6200, longitude: 77.2100 },
    status: 'online' as const,
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@rideapp.com',
    phone: '+91-9876543212',
    vehicle_number: 'DL-03-EF-9012',
    vehicle_type: 'economy',
    rating: 4.5,
    total_rides: 389,
    cancellation_rate: 0.05,
    idle_time_seconds: 1200,
    estimated_pickup_time_seconds: 360,
    surge_zone_priority: 0.8,
    current_location: { latitude: 28.6250, longitude: 77.1950 },
    status: 'online' as const,
  },
  {
    name: 'Neha Singh',
    email: 'neha.singh@rideapp.com',
    phone: '+91-9876543213',
    vehicle_number: 'DL-04-GH-3456',
    vehicle_type: 'xl',
    rating: 4.7,
    total_rides: 667,
    cancellation_rate: 0.03,
    idle_time_seconds: 450,
    estimated_pickup_time_seconds: 300,
    surge_zone_priority: 1.2,
    current_location: { latitude: 28.6100, longitude: 77.2200 },
    status: 'online' as const,
  },
  {
    name: 'Vikram Desai',
    email: 'vikram.desai@rideapp.com',
    phone: '+91-9876543214',
    vehicle_number: 'DL-05-IJ-7890',
    vehicle_type: 'economy',
    rating: 4.3,
    total_rides: 234,
    cancellation_rate: 0.08,
    idle_time_seconds: 1800,
    estimated_pickup_time_seconds: 420,
    surge_zone_priority: 0.9,
    current_location: { latitude: 28.5950, longitude: 77.2050 },
    status: 'online' as const,
  },
  {
    name: 'Ananya Das',
    email: 'ananya.das@rideapp.com',
    phone: '+91-9876543215',
    vehicle_number: 'DL-06-KL-1357',
    vehicle_type: 'premium',
    rating: 4.9,
    total_rides: 945,
    cancellation_rate: 0.01,
    idle_time_seconds: 200,
    estimated_pickup_time_seconds: 150,
    surge_zone_priority: 1.8,
    current_location: { latitude: 28.6300, longitude: 77.2000 },
    status: 'online' as const,
  },
  {
    name: 'Suresh Verma',
    email: 'suresh.verma@rideapp.com',
    phone: '+91-9876543216',
    vehicle_number: 'DL-07-MN-2468',
    vehicle_type: 'economy',
    rating: 4.6,
    total_rides: 456,
    cancellation_rate: 0.04,
    idle_time_seconds: 750,
    estimated_pickup_time_seconds: 280,
    surge_zone_priority: 1.1,
    current_location: { latitude: 28.6150, longitude: 77.1900 },
    status: 'online' as const,
  },
  {
    name: 'Deepa Joshi',
    email: 'deepa.joshi@rideapp.com',
    phone: '+91-9876543217',
    vehicle_number: 'DL-08-OP-3579',
    vehicle_type: 'xl',
    rating: 4.4,
    total_rides: 312,
    cancellation_rate: 0.06,
    idle_time_seconds: 900,
    estimated_pickup_time_seconds: 350,
    surge_zone_priority: 1.0,
    current_location: { latitude: 28.6050, longitude: 77.2150 },
    status: 'online' as const,
  },
  {
    name: 'Arjun Gupta',
    email: 'arjun.gupta@rideapp.com',
    phone: '+91-9876543218',
    vehicle_number: 'DL-09-QR-4680',
    vehicle_type: 'economy',
    rating: 4.8,
    total_rides: 678,
    cancellation_rate: 0.02,
    idle_time_seconds: 550,
    estimated_pickup_time_seconds: 260,
    surge_zone_priority: 1.3,
    current_location: { latitude: 28.6180, longitude: 77.1970 },
    status: 'online' as const,
  },
  {
    name: 'Sneha Rao',
    email: 'sneha.rao@rideapp.com',
    phone: '+91-9876543219',
    vehicle_number: 'DL-10-ST-5791',
    vehicle_type: 'premium',
    rating: 4.7,
    total_rides: 789,
    cancellation_rate: 0.02,
    idle_time_seconds: 400,
    estimated_pickup_time_seconds: 200,
    surge_zone_priority: 1.6,
    current_location: { latitude: 28.6270, longitude: 77.2080 },
    status: 'online' as const,
  },
];

export async function seedDrivers(): Promise<void> {
  const client = await database.getClient();

  try {
    await client.query('BEGIN');

    // Check if drivers already exist
    const countResult = await client.query('SELECT COUNT(*) FROM drivers');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      console.log(`Database already has ${count} drivers. Skipping seed.`);
      await client.query('ROLLBACK');
      return;
    }

    console.log('Seeding database with dummy drivers...');

    // Insert drivers
    const insertQuery = `
      INSERT INTO drivers (
        id, name, email, phone, vehicle_number, vehicle_type,
        status, current_location, rating, total_rides,
        cancellation_rate, idle_time_seconds, estimated_pickup_time_seconds,
        surge_zone_priority, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    `;

    for (const driver of DUMMY_DRIVERS) {
      const driverId = uuidv4();
      await client.query(insertQuery, [
        driverId,
        driver.name,
        driver.email,
        driver.phone,
        driver.vehicle_number,
        driver.vehicle_type,
        driver.status,
        JSON.stringify(driver.current_location),
        driver.rating,
        driver.total_rides,
        driver.cancellation_rate,
        driver.idle_time_seconds,
        driver.estimated_pickup_time_seconds,
        driver.surge_zone_priority,
      ]);

      console.log(`✓ Created driver: ${driver.name} (${driver.vehicle_number})`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ Successfully seeded ${DUMMY_DRIVERS.length} drivers`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding drivers:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
async function runSeed() {
  try {
    await seedDrivers();
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (process.argv[1]?.includes('seeds.ts')) {
  runSeed();
}
