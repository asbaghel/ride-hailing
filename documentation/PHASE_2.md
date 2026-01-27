# Phase 2 - Backend API and Database Setup

## Objective
Build a complete backend API with TypeScript, Express, PostgreSQL database, and Docker containerization.

## Completed Tasks

### ✅ Backend Project Initialization
- [x] Created TypeScript backend in `backend/` directory
- [x] Configured `package.json` with Express and PostgreSQL dependencies
- [x] Set up `tsconfig.json` for TypeScript compilation
- [x] Created environment configuration template (`.env.example`)
- [x] Proper project structure with routes, types, and database modules

### ✅ Database Setup
- [x] Created PostgreSQL 15 Alpine Docker service
- [x] Implemented connection pooling with pg library
- [x] Created complete database schema with 5 tables:
  - **rides** - Ride requests with user and driver information
  - **drivers** - Driver profiles and current status
  - **trips** - Trip records with fare calculations
  - **payments** - Payment transactions
  - **driver_locations** - Location history for tracking
- [x] Added database indexes for query optimization
- [x] Implemented proper foreign key relationships

### ✅ Adminer Database Admin
- [x] Added Adminer service on port 8080
- [x] Web-based database management interface
- [x] Easy database inspection and administration

### ✅ Core API Endpoints
- [x] **POST /v1/rides** - Create ride requests
- [x] **GET /v1/rides/{id}** - Get ride status
- [x] **PUT /v1/rides/{id}/cancel** - Cancel rides
- [x] **POST /v1/drivers/{id}/location** - Update driver location
- [x] **POST /v1/drivers/{id}/accept** - Accept ride assignments
- [x] **GET /v1/drivers/{id}** - Get driver details
- [x] **POST /v1/trips/{id}/end** - End trip with fare calculation
- [x] **GET /v1/trips/{id}** - Get trip details
- [x] **POST /v1/payments** - Process payments (with idempotency check)
- [x] **GET /v1/payments/{id}** - Get payment details
- [x] **GET /v1/payments/trip/{trip_id}** - Get trip payments

### ✅ Database Features
- [x] Automatic UUID generation for all records
- [x] Timestamp tracking (created_at, updated_at)
- [x] JSONB for flexible location data storage
- [x] Automatic fare calculation algorithm:
  - Base fare: $2.50
  - Per km rate: $1.50
  - Per minute rate: $0.25
- [x] Database transactions for multi-step operations
- [x] Connection pooling for performance
- [x] Health check endpoint
- [x] Comprehensive error handling

### ✅ Docker Integration
- [x] Created multi-stage Dockerfile for backend
- [x] PostgreSQL container with proper environment setup
- [x] Updated `docker-compose.yml` with all services
- [x] Service dependencies configuration
- [x] Health checks for database readiness
- [x] Proper networking between services
- [x] Volume management for persistent data

### ✅ Type Safety
- [x] TypeScript types for all entities
- [x] Type-safe database queries
- [x] Interface definitions for requests and responses
- [x] Strong typing for API responses

### ✅ Documentation
- [x] Created `BACKEND_API.md` with complete API documentation
- [x] Database schema documentation
- [x] Request/response examples for all endpoints
- [x] Fare calculation formula
- [x] Error handling guide
- [x] Database management guide
- [x] Updated main README with Phase 2 information
- [x] Environment variable documentation

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express server and route setup
│   ├── database/
│   │   └── connection.ts     # PostgreSQL connection pool and initialization
│   ├── routes/
│   │   ├── rides.ts          # Ride management endpoints
│   │   ├── drivers.ts        # Driver management endpoints
│   │   ├── trips.ts          # Trip management endpoints
│   │   └── payments.ts       # Payment processing endpoints
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── Dockerfile                # Backend Docker configuration
├── .dockerignore             # Files to exclude from Docker build
├── .gitignore                # Git ignore rules
├── .env.example              # Environment variables template
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

## Database Schema

### Rides Table
Stores all ride requests with status tracking and fare information.

### Drivers Table
Maintains driver profiles with current status and location.

### Trips Table
Records completed trips with distance, duration, and fare calculation.

### Payments Table
Tracks all payment transactions with idempotency support.

### Driver Locations Table
Maintains location history for analytics and tracking.

## API Features

### 1. Idempotency
- Payment endpoint checks for existing completed payments
- Prevents duplicate charges
- Returns conflict status if already processed

### 2. Transactions
- Multi-step operations use database transactions
- Driver accept ride operation is atomic
- Trip end operation updates multiple tables atomically

### 3. Automatic Fare Calculation
- Triggered when trip ends
- Based on distance and duration
- Formula: `fare = 2.5 + (distance_km × 1.5) + (duration_minutes × 0.25)`

### 4. Status Management
- Rides: pending → accepted → in_progress → completed/cancelled
- Drivers: offline ↔ online ↔ on_trip
- Payments: pending → completed/failed

### 5. Location Tracking
- Driver locations are recorded with timestamps
- Current location maintained in driver profile
- Historical data available for analytics

## Service Configuration

### PostgreSQL
- **Host**: postgres (container name)
- **Port**: 5432
- **Database**: ride_hailing_db
- **User**: ride_user
- **Password**: ride_password
- **Pool Size**: 2-10 connections

### Backend API
- **Host**: backend (container name)
- **Port**: 8000
- **Environment**: development
- **Database Connection**: Automatic on startup

### Adminer
- **URL**: http://localhost:8080
- **System**: PostgreSQL
- **Auto-fill**: postgres
- **Credentials**: ride_user / ride_password

## How to Run

### With Docker Compose
```bash
docker-compose up --build
```

Services will start in order:
1. PostgreSQL - database initialization
2. Adminer - waits for database
3. Backend - waits for database health check
4. Frontend - waits for backend

### Local Development
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database (via adminer)
http://localhost:8080

# Frontend
http://localhost:8089
```

## Testing the APIs

### Create a Ride
```bash
curl -X POST http://localhost:8000/v1/rides \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "pickup_location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "Times Square"
    },
    "dropoff_location": {
      "latitude": 40.7505,
      "longitude": -73.9972,
      "address": "Central Park"
    }
  }'
```

### Get Ride Status
```bash
curl http://localhost:8000/v1/rides/{ride-id}
```

### Update Driver Location
```bash
curl -X POST http://localhost:8000/v1/drivers/{driver-id}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Accept Ride
```bash
curl -X POST http://localhost:8000/v1/drivers/{driver-id}/accept \
  -H "Content-Type: application/json" \
  -d '{"ride_id": "{ride-id}"}'
```

### End Trip
```bash
curl -X POST http://localhost:8000/v1/trips/{trip-id}/end \
  -H "Content-Type: application/json" \
  -d '{
    "distance_km": 3.5,
    "duration_minutes": 12
  }'
```

### Process Payment
```bash
curl -X POST http://localhost:8000/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "{trip-id}",
    "amount": 10.85,
    "payment_method": "card"
  }'
```

## Key Design Principles

1. **Type Safety**: Full TypeScript implementation
2. **Data Consistency**: Transactions ensure ACID properties
3. **Performance**: Connection pooling and indexed queries
4. **Scalability**: Containerized for Kubernetes deployment
5. **Idempotency**: All operations handle retries safely
6. **Error Handling**: Comprehensive error responses
7. **Monitoring**: Health checks and logging

## Technologies Used

- **Language**: TypeScript
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Connection**: pg library with pooling
- **Utilities**: uuid, cors, body-parser
- **Container**: Docker with Alpine Linux

## Next Phase (Phase 3)

- [ ] Authentication & Authorization system
- [ ] JWT token implementation
- [ ] User registration and login
- [ ] Driver verification workflow
- [ ] WebSocket for real-time updates
- [ ] Advanced ride matching algorithm
- [ ] Rating and review system
- [ ] Email notifications

## Notes

- All timestamps are in UTC
- Locations are stored as JSONB for flexibility
- Fare calculation is automatic and consistent
- Database migration scripts can be added in Phase 3
- Ready for Kubernetes deployment
- New Relic integration can be added for observability
