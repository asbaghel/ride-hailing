import { Pool, PoolClient } from 'pg';

class Database {
  private pool: Pool;
  private initialized: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'ride_hailing_db',
      user: process.env.DB_USER || 'ride_user',
      password: process.env.DB_PASSWORD || 'ride_password',
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const client = await this.pool.connect();
      try {
        // Create rides table
        await client.query(`
          CREATE TABLE IF NOT EXISTS rides (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            driver_id UUID,
            pickup_location JSONB NOT NULL,
            dropoff_location JSONB NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            estimated_fare DECIMAL(10, 2),
            actual_fare DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            ended_at TIMESTAMP
          );
        `);

        // Create drivers table
        await client.query(`
          CREATE TABLE IF NOT EXISTS drivers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            vehicle_number VARCHAR(50),
            status VARCHAR(50) DEFAULT 'offline',
            current_location JSONB,
            rating DECIMAL(3, 2) DEFAULT 0,
            total_rides INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create trips table
        await client.query(`
          CREATE TABLE IF NOT EXISTS trips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ride_id UUID NOT NULL,
            driver_id UUID NOT NULL,
            distance_km DECIMAL(10, 2),
            duration_minutes INT,
            fare DECIMAL(10, 2),
            payment_method VARCHAR(50),
            payment_status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ride_id) REFERENCES rides(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
          );
        `);

        // Create driver locations table for tracking
        await client.query(`
          CREATE TABLE IF NOT EXISTS driver_locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            driver_id UUID NOT NULL,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
          );
        `);

        // Create payments table
        await client.query(`
          CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trip_id UUID NOT NULL,
            amount DECIMAL(10, 2),
            currency VARCHAR(3) DEFAULT 'USD',
            payment_method VARCHAR(50),
            status VARCHAR(50) DEFAULT 'pending',
            transaction_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
          );
        `);

        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_trips_ride_id ON trips(ride_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id)');

        console.log('Database initialized successfully');
        this.initialized = true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    try {
      const result = await this.pool.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a single row query
   */
  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Get a client connection for transactions
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT NOW()');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new Database();
