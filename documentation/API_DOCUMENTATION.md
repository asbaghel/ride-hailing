# Frontend API Documentation

## Overview
This document describes the API structure and specifications for the frontend application.

## API Base URL
- Development: `http://localhost:8000`
- Production: `https://api.ridehailing.com`

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Rides
- `GET /api/rides` - List available rides
- `POST /api/rides` - Create a new ride
- `GET /api/rides/{id}` - Get ride details
- `PUT /api/rides/{id}` - Update ride details
- `DELETE /api/rides/{id}` - Cancel ride

### Drivers
- `GET /api/drivers` - List available drivers
- `GET /api/drivers/{id}` - Get driver details
- `PUT /api/drivers/{id}` - Update driver details

### Ratings
- `POST /api/ratings` - Submit a rating
- `GET /api/ratings/{id}` - Get ratings

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
