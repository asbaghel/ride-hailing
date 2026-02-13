require('newrelic');

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import database from './database/connection';
import { seedDrivers } from './database/seeds';
import ridesRouter from './routes/rides';
import driversRouter from './routes/drivers';
import tripsRouter from './routes/trips';
import paymentsRouter from './routes/payments';
import locationsRouter from './routes/locations';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await database.healthCheck();
    if (isHealthy) {
      return res.status(200).json({
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'Database is not responding',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/v1/rides', ridesRouter);
app.use('/v1/drivers', driversRouter);
app.use('/v1/trips', tripsRouter);
app.use('/v1/payments', paymentsRouter);
app.use('/v1/locations', locationsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    console.log('Initializing database...');
    await database.initialize();
    console.log('Database initialized successfully');

    // Seed dummy drivers if needed
    console.log('Seeding drivers...');
    await seedDrivers();

    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  POST   /v1/rides - Create a ride`);
      console.log(`  GET    /v1/rides/:id - Get ride status`);
      console.log(`  POST   /v1/drivers/:id/location - Update driver location`);
      console.log(`  POST   /v1/drivers/:id/accept - Accept a ride`);
      console.log(`  POST   /v1/trips/:id/end - End trip`);
      console.log(`  POST   /v1/payments - Process payment`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
