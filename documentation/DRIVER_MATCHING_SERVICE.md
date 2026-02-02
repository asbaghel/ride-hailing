# Driver Matching Service - Implementation Guide

## Overview

Implemented a comprehensive driver-matching algorithm for the ride-hailing backend that intelligently selects the best available driver for each ride request using weighted scoring.

## Architecture

### 1. **Pure Scoring Algorithm** (`matchingAlgorithm.ts`)
   - **Location**: `backend/src/services/matchingAlgorithm.ts`
   - **No database or networking code** - Pure algorithm implementation
   - **Deterministic and testable**

### 2. **Database Integration** (`driverMatching.ts`)
   - **Location**: `backend/src/services/driverMatching.ts`
   - Fetches available drivers from database
   - Applies scoring algorithm
   - Manages driver-to-ride assignment with transactions

### 3. **Database Schema** (Updated)
   - Added new fields to `drivers` table:
     - `vehicle_type` - economy/premium/xl
     - `cancellation_rate` - 0.0-1.0
     - `idle_time_seconds` - Time since last trip
     - `estimated_pickup_time_seconds` - ETA to rider
     - `surge_zone_priority` - 1.0-2.0+ multiplier
     - `last_location_update` - Track location freshness

### 4. **Seed Data** (`seeds.ts`)
   - **Location**: `backend/src/database/seeds.ts`
   - 10 dummy drivers with realistic metrics
   - Auto-seeds on server startup (if database is empty)
   - Can be run manually: `npm run seed`

## Scoring Formula

```
score = w1*distance + w2*pickup_time + w3*idle_time + w4*rating_penalty + w5*cancellation_risk + w6*surge_priority

Lower score = better match
```

### Weight Configuration (DEFAULT_MATCHING_CONFIG)

| Weight | Factor | Value | Notes |
|--------|--------|-------|-------|
| w1 | Distance | 1.0 | 1 point per km to rider |
| w2 | Pickup Time | 0.01 | 0.01 point per second (~3/min) |
| w3 | Idle Time | -0.001 | Negative = prefer idle drivers |
| w4 | Rating Penalty | 5.0 | 5 points per 1.0 rating decrease |
| w5 | Cancellation Risk | 10.0 | 10 points per 0.1 cancellation rate |
| w6 | Surge Priority | -0.5 | Negative = prefer surge drivers |

### Metric Calculations

**Distance**: Haversine formula (great-circle distance)
```
- Uses exact coordinates
- Returns distance in kilometers
```

**Pickup Time**: Driver's estimated availability
```
- Default: 300 seconds (5 minutes)
- From driver's idle_time_seconds
```

**Idle Time**: Time since last completed trip
```
- Negative weight encourages assignment to idle drivers
- Balances load distribution
```

**Rating Penalty**: Incentivizes high-rated drivers
```
- 5.0 rating → penalty = 0
- 4.5 rating → penalty = 2.5
- 4.0 rating → penalty = 5.0
- Prevents very low-rated drivers
```

**Cancellation Risk**: Punishes unreliable drivers
```
- 0% cancellation → risk = 0
- 5% cancellation → risk = 5 (scored as 10*0.05)
- 10% cancellation → risk = 10 (scored as 10*0.1)
```

**Surge Priority**: Incentivizes drivers in high-demand zones
```
- 1.0 = normal zone
- 1.5 = medium surge
- 2.0+ = high surge
- Negative weight makes surge zones more attractive
```

## Key Functions

### Core Algorithm Functions

1. **`calculateDriverScore(driver, pickupLocation, config)`**
   - Computes single driver's score
   - Returns `Infinity` if no location
   - Most basic operation

2. **`scoreDrivers(drivers, pickupLocation, config)`**
   - Scores all drivers
   - Filters by status='online' and has location
   - Returns sorted array (best to worst)
   - **Returns `ScoredDriver[]`** with detailed metrics

3. **`selectBestDriver(drivers, pickupLocation, config)`**
   - Returns single best driver (lowest score)
   - Returns `null` if no drivers available
   - Used by matching service

4. **`getTopDrivers(drivers, pickupLocation, topN, config)`**
   - Returns top N drivers
   - Useful for fallback logic or A/B testing
   - Default: top 5

5. **`getDriverScoreBreakdown(driver, pickupLocation, config)`**
   - Debugging function
   - Returns component breakdown
   - Useful for observability/logging

### Database Integration Functions

1. **`matchDriverToRide(ride, config)`**
   - Fetches all online drivers
   - Applies algorithm
   - Returns best match
   - **Main entry point**

2. **`getTopCandidateDrivers(ride, topN, config)`**
   - Returns top N candidates with scores
   - For analytics/logging

3. **`assignDriverToRide(rideId, driverId)`**
   - Atomically assigns driver to ride
   - Updates driver status to 'on_trip'
   - Uses database transaction

## Sample Dummy Drivers

10 drivers with diverse metrics:

```
1. Rajesh Kumar - 4.8⭐, 2% cancel, 240s pickup
2. Priya Sharma - 4.9⭐, 1% cancel, 180s pickup (PREMIUM, surge 1.5)
3. Amit Patel - 4.5⭐, 5% cancel, 360s pickup
4. Neha Singh - 4.7⭐, 3% cancel, XL vehicle
5. Vikram Desai - 4.3⭐, 8% cancel (lower reliability)
6. Ananya Das - 4.9⭐, 1% cancel, 150s pickup (PREMIUM, surge 1.8)
7. Suresh Verma - 4.6⭐, 4% cancel
8. Deepa Joshi - 4.4⭐, 6% cancel, XL vehicle
9. Arjun Gupta - 4.8⭐, 2% cancel, surge 1.3
10. Sneha Rao - 4.7⭐, 2% cancel (PREMIUM, surge 1.6)
```

All located in Delhi area (28.6°N, 77.2°E)

## Database Changes

### New Drivers Table Schema

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  vehicle_number VARCHAR(50),
  vehicle_type VARCHAR(50),           -- NEW
  status VARCHAR(50),
  current_location JSONB,
  rating DECIMAL(3, 2),
  total_rides INT,
  cancellation_rate DECIMAL(3, 2),    -- NEW
  idle_time_seconds INT,              -- NEW
  estimated_pickup_time_seconds INT,  -- NEW
  surge_zone_priority DECIMAL(5, 2),  -- NEW
  last_location_update TIMESTAMP,     -- NEW
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Usage Examples

### 1. Match a driver to a ride

```typescript
import { matchDriverToRide } from './services/driverMatching';

const ride = { 
  id: 'ride-123',
  pickup_location: { latitude: 28.6139, longitude: 77.2090 },
  // ... other ride fields
};

const driver = await matchDriverToRide(ride);
if (driver) {
  console.log(`Assigned driver: ${driver.name}`);
  // Driver is ready to be assigned
}
```

### 2. Get top 5 candidates (for multi-attempt assignment)

```typescript
import { getTopCandidateDrivers } from './services/driverMatching';

const topCandidates = await getTopCandidateDrivers(ride, 5);
topCandidates.forEach((scored, i) => {
  console.log(`${i+1}. ${scored.driver.name} - Score: ${scored.score.toFixed(2)}`);
});
```

### 3. Check score breakdown (debugging)

```typescript
import { getDriverScoreBreakdown } from './services/matchingAlgorithm';

const breakdown = getDriverScoreBreakdown(driver, pickupLocation);
console.log(`
  Total Score: ${breakdown.total_score}
  Distance: ${breakdown.distance_component} (${breakdown.raw_distance_km} km)
  Rating Penalty: ${breakdown.rating_penalty_component}
  Cancellation Risk: ${breakdown.cancellation_risk_component}
`);
```

### 4. Adjust weights for different scenarios

```typescript
// Prefer very close drivers (increase distance weight)
const config = {
  ...DEFAULT_MATCHING_CONFIG,
  w1: 5.0,  // Was 1.0
};

const driver = selectBestDriver(drivers, pickupLocation, config);
```

## Integration with Rides API

The rides creation endpoint now:

1. Creates ride in DB with status='pending'
2. Calls `matchDriverToRide(ride)`
3. If driver found: assigns and returns ride with driver_id
4. If no driver: returns ride in pending status

```typescript
// In rides.ts POST /v1/rides
const matchedDriver = await matchDriverToRide(ride);
if (matchedDriver) {
  const assignedRide = await assignDriverToRide(ride.id, matchedDriver.id);
  // Return success with assigned ride
} else {
  // Return pending ride (searching for drivers)
}
```

## Extensibility

### Easy to adjust:
1. **Weights**: Modify `DEFAULT_MATCHING_CONFIG`
2. **Distance calculation**: Update `calculateDistance()` for custom geospatial queries
3. **Filters**: Add status/area filters in `matchDriverToRide()`
4. **Metrics**: Add new scoring factors by extending interfaces

### Future improvements:
- Real-time location tracking
- Distance-based nearest-neighbor optimization
- Machine learning for weight optimization
- A/B testing framework
- Surge pricing integration
- Driver preference/skill matching

## Testing

### Test the matching algorithm (pure functions)

```typescript
const testDriver: Driver = {
  id: '123',
  name: 'Test Driver',
  email: 'test@example.com',
  status: 'online',
  current_location: { latitude: 28.6100, longitude: 77.2000 },
  rating: 4.8,
  cancellation_rate: 0.02,
  idle_time_seconds: 600,
  estimated_pickup_time_seconds: 240,
  surge_zone_priority: 1.0,
  // ... other fields
};

const pickup = { latitude: 28.6139, longitude: 77.2090 };
const score = calculateDriverScore(testDriver, pickup);
console.log(`Score: ${score}`);
```

### Seed dummy drivers

```bash
# Automatic on server start (if DB empty)
# Or manually:
npm run seed
```

## Performance Considerations

- **Algorithm**: O(n) where n = number of available drivers
- **Haversine**: O(1) per distance calculation
- **Sorting**: O(n log n) for ranking
- **DB Query**: Single query to fetch online drivers
- **Transaction**: Atomic assignment to prevent race conditions

## Monitoring & Observability

Log available in `getTopCandidateDrivers()`:
- Top 5 matches with scores
- Distance/time metrics
- Rejection reasons (no location, offline, etc.)

Debug available in `getDriverScoreBreakdown()`:
- Component-wise score breakdown
- Raw metric values
- Useful for monitoring driver selection

---

**Status**: ✅ Fully Implemented and Ready
**Database**: ✅ Updated with new fields
**Dummy Data**: ✅ 10 drivers seeded
**Frontend Integration**: ✅ Uses rides API which calls matching service
**Documentation**: ✅ Complete
