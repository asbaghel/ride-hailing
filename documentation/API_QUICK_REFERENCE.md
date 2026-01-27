# API Quick Reference

## Base URL
```
http://localhost:8000
```

## Authentication
*Not implemented in Phase 2. Added in Phase 3.*

## Common Headers
```
Content-Type: application/json
Accept: application/json
```

## Response Format

### Success (2xx)
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Error (4xx, 5xx)
```json
{
  "success": false,
  "error": "Error description"
}
```

## Rides Endpoints

### Create Ride
```
POST /v1/rides
Content-Type: application/json

Body:
{
  "user_id": "uuid",
  "pickup_location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "Optional address"
  },
  "dropoff_location": {
    "latitude": 40.7505,
    "longitude": -73.9972,
    "address": "Optional address"
  },
  "estimated_fare": 15.50
}

Response: 201
{
  "success": true,
  "data": { ride object },
  "message": "Ride created successfully"
}
```

### Get Ride
```
GET /v1/rides/{ride_id}

Response: 200
{
  "success": true,
  "data": { ride object }
}
```

### Cancel Ride
```
PUT /v1/rides/{ride_id}/cancel

Response: 200
{
  "success": true,
  "data": { ride object },
  "message": "Ride cancelled successfully"
}
```

## Drivers Endpoints

### Update Location
```
POST /v1/drivers/{driver_id}/location
Content-Type: application/json

Body:
{
  "latitude": 40.7128,
  "longitude": -74.0060
}

Response: 200
{
  "success": true,
  "data": { driver object },
  "message": "Location updated successfully"
}
```

### Accept Ride
```
POST /v1/drivers/{driver_id}/accept
Content-Type: application/json

Body:
{
  "ride_id": "ride-uuid"
}

Response: 200
{
  "success": true,
  "data": {
    "driver": { driver object },
    "ride": { ride object }
  },
  "message": "Ride accepted successfully"
}
```

### Get Driver
```
GET /v1/drivers/{driver_id}

Response: 200
{
  "success": true,
  "data": { driver object }
}
```

## Trips Endpoints

### End Trip
```
POST /v1/trips/{trip_id}/end
Content-Type: application/json

Body:
{
  "distance_km": 3.5,
  "duration_minutes": 12
}

Response: 200
{
  "success": true,
  "data": {
    "trip": { trip object with calculated fare },
    "ride": { updated ride object }
  },
  "message": "Trip ended and fare calculated successfully"
}
```

### Get Trip
```
GET /v1/trips/{trip_id}

Response: 200
{
  "success": true,
  "data": { trip object }
}
```

## Payments Endpoints

### Process Payment
```
POST /v1/payments
Content-Type: application/json

Body:
{
  "trip_id": "trip-uuid",
  "amount": 10.85,
  "payment_method": "card",
  "currency": "USD"
}

Response: 201
{
  "success": true,
  "data": { payment object },
  "message": "Payment processed successfully"
}
```

### Get Payment
```
GET /v1/payments/{payment_id}

Response: 200
{
  "success": true,
  "data": { payment object }
}
```

### Get Trip Payments
```
GET /v1/payments/trip/{trip_id}

Response: 200
{
  "success": true,
  "data": [ payment objects ]
}
```

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Payment already processed |
| 500 | Server Error - Internal error |

## Ride Status Values
- `pending` - Waiting for driver acceptance
- `accepted` - Driver accepted
- `in_progress` - Ride in progress
- `completed` - Ride completed
- `cancelled` - Ride cancelled

## Driver Status Values
- `offline` - Driver offline
- `online` - Driver online, available
- `on_trip` - Driver on an active trip

## Payment Status Values
- `pending` - Payment pending
- `completed` - Payment successful
- `failed` - Payment failed

## Fare Calculation
```
fare = 2.5 + (distance_km × 1.5) + (duration_minutes × 0.25)

Example:
distance = 3.5 km
duration = 12 minutes
fare = 2.5 + (3.5 × 1.5) + (12 × 0.25)
fare = 2.5 + 5.25 + 3.0
fare = $10.75
```

## Error Examples

### Missing Required Field
```json
{
  "success": false,
  "error": "Missing required fields: user_id, pickup_location, dropoff_location"
}
```

### Resource Not Found
```json
{
  "success": false,
  "error": "Ride not found"
}
```

### Duplicate Payment
```json
{
  "success": false,
  "error": "Payment already processed for this trip",
  "data": { existing payment object }
}
```

## Example Workflow

1. **Create Ride**
   ```bash
   POST /v1/rides
   → Returns ride_id and status: "pending"
   ```

2. **Update Driver Location**
   ```bash
   POST /v1/drivers/{driver_id}/location
   → Returns updated driver location
   ```

3. **Driver Accepts Ride**
   ```bash
   POST /v1/drivers/{driver_id}/accept
   → Ride status changes to "accepted"
   → Driver status changes to "on_trip"
   ```

4. **End Trip**
   ```bash
   POST /v1/trips/{trip_id}/end
   → Fare calculated automatically
   → Ride status changes to "completed"
   → Driver status changes back to "online"
   ```

5. **Process Payment**
   ```bash
   POST /v1/payments
   → Payment recorded with transaction ID
   → Trip marked as paid
   ```

## Health Check
```
GET /v1/health

Response: 200
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2026-01-27T10:00:00.000Z"
}
```

## Database Admin
```
URL: http://localhost:8080
System: PostgreSQL
Server: postgres
Username: ride_user
Password: ride_password
Database: ride_hailing_db
```
