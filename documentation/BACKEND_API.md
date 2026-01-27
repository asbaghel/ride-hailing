# Backend API Documentation - Phase 2

## Overview
Complete backend API implementation with TypeScript, Express, and PostgreSQL.

## Technology Stack

### Backend
- **Language**: TypeScript
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Admin Tool**: Adminer
- **Container**: Docker

## Services

### 1. PostgreSQL Database
- **Port**: 5432
- **Container**: `ride-hailing-postgres`
- **Database**: `ride_hailing_db`
- **User**: `ride_user`
- **Tables**:
  - `rides` - Store ride requests and status
  - `drivers` - Driver information and current status
  - `trips` - Trip details with fare calculations
  - `payments` - Payment records
  - `driver_locations` - Location history tracking

### 2. Adminer (Database Admin)
- **Port**: 8080
- **URL**: http://localhost:8080
- **Purpose**: Web-based database management interface
- **Access**: Select PostgreSQL, use credentials above

### 3. Backend API
- **Port**: 8000
- **Container**: `ride-hailing-backend`
- **Base URL**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Rides Management

#### Create a Ride
```
POST /v1/rides
Content-Type: application/json

{
  "user_id": "uuid",
  "pickup_location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Times Square, NY"
  },
  "dropoff_location": {
    "latitude": 40.7505,
    "longitude": -73.9972,
    "address": "Central Park, NY"
  },
  "estimated_fare": 15.50
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "user_id": "user-uuid",
    "driver_id": null,
    "pickup_location": {...},
    "dropoff_location": {...},
    "status": "pending",
    "estimated_fare": 15.50,
    "created_at": "2026-01-27T10:00:00Z",
    "updated_at": "2026-01-27T10:00:00Z"
  }
}
```

#### Get Ride Status
```
GET /v1/rides/{id}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "ride-uuid",
    "user_id": "user-uuid",
    "driver_id": "driver-uuid",
    "status": "in_progress",
    ...
  }
}
```

#### Cancel Ride
```
PUT /v1/rides/{id}/cancel

Response: 200 OK
{
  "success": true,
  "data": {...},
  "message": "Ride cancelled successfully"
}
```

### Driver Management

#### Update Driver Location
```
POST /v1/drivers/{id}/location
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "driver-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "online",
    "current_location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    ...
  }
}
```

#### Accept Ride Assignment
```
POST /v1/drivers/{id}/accept
Content-Type: application/json

{
  "ride_id": "ride-uuid"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "driver": {...},
    "ride": {...}
  },
  "message": "Ride accepted successfully"
}
```

#### Get Driver Details
```
GET /v1/drivers/{id}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "driver-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "vehicle_number": "ABC-1234",
    "status": "online",
    "rating": 4.8,
    "total_rides": 245,
    ...
  }
}
```

### Trip Management

#### End Trip
```
POST /v1/trips/{id}/end
Content-Type: application/json

{
  "distance_km": 3.5,
  "duration_minutes": 12
}

Response: 200 OK
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-uuid",
      "ride_id": "ride-uuid",
      "driver_id": "driver-uuid",
      "distance_km": 3.5,
      "duration_minutes": 12,
      "fare": 10.85,
      "payment_status": "pending",
      ...
    },
    "ride": {...}
  },
  "message": "Trip ended and fare calculated successfully"
}
```

**Fare Calculation Formula**:
```
fare = BASE_FARE + (distance_km × PER_KM_RATE) + (duration_minutes × PER_MINUTE_RATE)
fare = 2.5 + (distance_km × 1.5) + (duration_minutes × 0.25)
```

#### Get Trip Details
```
GET /v1/trips/{id}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "ride_id": "ride-uuid",
    "driver_id": "driver-uuid",
    ...
  }
}
```

### Payment Processing

#### Process Payment
```
POST /v1/payments
Content-Type: application/json

{
  "trip_id": "trip-uuid",
  "amount": 10.85,
  "payment_method": "card",
  "currency": "USD"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "trip_id": "trip-uuid",
    "amount": 10.85,
    "currency": "USD",
    "payment_method": "card",
    "status": "completed",
    "transaction_id": "TXN-1234567890",
    "created_at": "2026-01-27T10:15:00Z"
  },
  "message": "Payment processed successfully"
}
```

#### Get Payment Details
```
GET /v1/payments/{id}

Response: 200 OK
{
  "success": true,
  "data": {...}
}
```

#### Get Payments for Trip
```
GET /v1/payments/trip/{trip_id}

Response: 200 OK
{
  "success": true,
  "data": [...]
}
```

## Database Schema

### Rides Table
```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  driver_id UUID,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  estimated_fare DECIMAL(10, 2),
  actual_fare DECIMAL(10, 2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);
```

### Drivers Table
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  vehicle_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'offline',
  current_location JSONB,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_rides INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Trips Table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  distance_km DECIMAL(10, 2),
  duration_minutes INT,
  fare DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
```

### Driver Locations Table
```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY,
  driver_id UUID NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: user_id, pickup_location, dropoff_location"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Ride not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Payment already processed for this trip",
  "data": {...}
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Key Features

1. **Idempotent Operations**: All API calls are designed to be idempotent
2. **Transaction Support**: Database operations use transactions for consistency
3. **Automatic Fare Calculation**: Fare is calculated based on distance and duration
4. **Location Tracking**: Driver locations are tracked for analytics
5. **Status Management**: Ride and driver statuses are managed properly
6. **Error Handling**: Comprehensive error handling with meaningful messages
7. **Connection Pooling**: PostgreSQL connection pooling for performance

## Running the Backend

### With Docker Compose
```bash
docker-compose up --build
```

### Local Development
```bash
cd backend
npm install
npm run dev
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Environment Variables

Create a `.env` file in the backend directory:
```
PORT=8000
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ride_hailing_db
DB_USER=ride_user
DB_PASSWORD=ride_password
DB_POOL_MIN=2
DB_POOL_MAX=10
```
