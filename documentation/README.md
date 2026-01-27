# Ride Hailing Application - Documentation

This folder contains all documentation for the Ride Hailing Application project.

## Folder Structure

- **API_DOCUMENTATION.md** - Frontend API specifications and endpoints
- **BACKEND_API.md** - Complete backend API documentation with examples
- **ARCHITECTURE.md** - System architecture and design decisions
- **SETUP.md** - Setup and installation instructions
- **PHASE_1.md** - Phase 1 completion log (React Frontend)
- **PHASE_2.md** - Phase 2 completion log (Backend API & Database)

## Quick Navigation

### For Frontend Developers
- [Frontend Setup](./SETUP.md)
- [Frontend API Specifications](./API_DOCUMENTATION.md)

### For Backend Developers
- [Backend Setup](./BACKEND_API.md#running-the-backend)
- [API Endpoints Documentation](./BACKEND_API.md#api-endpoints)
- [Database Schema](./BACKEND_API.md#database-schema)
- [Database Management](./BACKEND_API.md#database-management)

### For System Architects
- [System Architecture](./ARCHITECTURE.md)
- [Tech Stack Overview](./README.md#current-implementation)

### Development Progress
- [Phase 1 - Frontend Setup](./PHASE_1.md)
- [Phase 2 - Backend & Database](./PHASE_2.md)

## Current Implementation

### Phase 1 ✅ Completed
- React 18 frontend
- React Router navigation
- Responsive UI
- Docker containerization

### Phase 2 ✅ Completed
- TypeScript backend with Express
- PostgreSQL database
- Complete CRUD API endpoints
- Payment processing
- Docker full-stack integration
- Adminer database admin tool

## Key Features

### Frontend
- Responsive design with Tailwind-like styling
- Mobile-friendly interface
- React Router for navigation
- Axios for API communication

### Backend
- RESTful API with TypeScript
- PostgreSQL with connection pooling
- Database transactions for consistency
- Idempotent operations
- Comprehensive error handling
- Health check endpoint

### Database
- Automatic schema creation
- UUID for distributed systems
- JSONB for location data
- Indexed queries for performance
- Foreign key relationships

## Quick Start

```bash
# Start all services
docker-compose up --build

# Access services
# Frontend: http://localhost:8089
# Backend API: http://localhost:8000
# Database Admin: http://localhost:8080
# Health Check: http://localhost:8000/health
```

## Documentation Map

```
documentation/
├── README.md (this file)
├── SETUP.md
│   ├── Prerequisites
│   ├── Docker Setup
│   ├── Local Development
│   └── Troubleshooting
├── API_DOCUMENTATION.md
│   ├── API Overview
│   ├── Response Format
│   └── Status Codes
├── BACKEND_API.md
│   ├── Services Overview
│   ├── API Endpoints (Complete)
│   ├── Database Schema
│   ├── Fare Calculation
│   └── Error Handling
├── ARCHITECTURE.md
│   ├── System Diagram
│   ├── Directory Structure
│   └── Design Principles
├── PHASE_1.md
│   ├── React Initialization
│   ├── Home Page
│   └── Docker Setup
└── PHASE_2.md
    ├── Backend Project Setup
    ├── Database Schema
    ├── API Endpoints
    ├── Docker Services
    └── Testing Examples
```

## API Endpoints Summary

### Rides
- `POST /v1/rides` - Create a ride
- `GET /v1/rides/{id}` - Get ride status
- `PUT /v1/rides/{id}/cancel` - Cancel a ride

### Drivers
- `POST /v1/drivers/{id}/location` - Update location
- `POST /v1/drivers/{id}/accept` - Accept a ride
- `GET /v1/drivers/{id}` - Get driver details

### Trips
- `POST /v1/trips/{id}/end` - End trip (with fare calculation)
- `GET /v1/trips/{id}` - Get trip details

### Payments
- `POST /v1/payments` - Process payment
- `GET /v1/payments/{id}` - Get payment details
- `GET /v1/payments/trip/{trip_id}` - Get trip payments

## Database Admin Access

**Adminer URL**: http://localhost:8080
- **System**: PostgreSQL
- **Server**: postgres
- **Username**: ride_user
- **Password**: ride_password
- **Database**: ride_hailing_db

## Common Tasks

### View Backend Logs
```bash
docker-compose logs backend -f
```

### View Database Logs
```bash
docker-compose logs postgres -f
```

### Access Database CLI
```bash
docker-compose exec postgres psql -U ride_user -d ride_hailing_db
```

### Rebuild Specific Service
```bash
docker-compose up --build backend
```

## Need Help?

1. Check the relevant documentation file above
2. Review PHASE_1.md or PHASE_2.md for implementation details
3. See ARCHITECTURE.md for system overview
4. Check BACKEND_API.md for API specifications with examples

## Version History

- **v1.0.0** (Phase 1) - Frontend React app with Docker
- **v2.0.0** (Phase 2) - Backend API, PostgreSQL, and full stack
- **v3.0.0** (Phase 3 - Upcoming) - Authentication and real-time features

