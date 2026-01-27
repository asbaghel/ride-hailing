import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../database/connection';
import { Payment, Trip } from '../types';

const paymentsRouter = Router();

/**
 * POST /v1/payments - Trigger payment flow
 * Request body: { trip_id, amount, payment_method }
 */
paymentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { trip_id, amount, payment_method, currency } = req.body;

    // Validate required fields
    if (!trip_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: trip_id, amount, payment_method',
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    const client = await database.getClient();
    try {
      await client.query('BEGIN');

      // Verify trip exists
      const getTripQuery = `SELECT * FROM trips WHERE id = $1;`;
      const tripResult = await client.query<Trip>(getTripQuery, [trip_id]);

      if (tripResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Trip not found',
        });
      }

      const trip = tripResult.rows[0];

      // Create payment record with idempotency in mind
      const payment_id = uuidv4();
      const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      // Check if payment already exists for this trip (for idempotency)
      const checkPaymentQuery = `
        SELECT * FROM payments WHERE trip_id = $1 AND status = 'completed';
      `;
      const existingPayment = await client.query<Payment>(checkPaymentQuery, [trip_id]);

      if (existingPayment.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: 'Payment already processed for this trip',
          data: existingPayment.rows[0],
        });
      }

      const insertPaymentQuery = `
        INSERT INTO payments (
          id, trip_id, amount, currency, payment_method, 
          status, transaction_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

      const insertResult = await client.query<Payment>(insertPaymentQuery, [
        payment_id,
        trip_id,
        amount,
        currency || 'USD',
        payment_method,
        'completed', // In real scenario, this would be 'pending' and updated async
        transaction_id,
        now,
        now,
      ]);

      if (insertResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(500).json({
          success: false,
          error: 'Failed to create payment record',
        });
      }

      // Update trip payment status
      const updateTripQuery = `
        UPDATE trips 
        SET payment_status = 'completed', updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      await client.query(updateTripQuery, [trip_id]);

      await client.query('COMMIT');

      const payment = insertResult.rows[0];

      return res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /v1/payments/:id - Get payment details
 */
paymentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required',
      });
    }

    const query = `
      SELECT * FROM payments WHERE id = $1;
    `;

    const payment = await database.queryOne<Payment>(query, [id]);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /v1/payments/trip/:trip_id - Get payment for a trip
 */
paymentsRouter.get('/trip/:trip_id', async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.params;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required',
      });
    }

    const query = `
      SELECT * FROM payments WHERE trip_id = $1;
    `;

    const payments = await database.query<Payment>(query, [trip_id]);

    return res.status(200).json({
      success: true,
      data: payments.rows,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default paymentsRouter;
