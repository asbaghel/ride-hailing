import { Driver, Location } from '../types';

/**
 * Driver Matching Service - Pure Algorithm Implementation
 * No networking or database code - this is a pure scoring function
 * 
 * Scoring Formula:
 * score = w1*distance + w2*pickup_time + w3*idle_time + w4*rating_penalty + w5*cancellation_risk + w6*surge_priority
 * 
 * Lower score = better match
 */

/**
 * Configuration for matching weights
 * Tune these values to adjust driver selection behavior
 */
export interface MatchingConfig {
  w1: number; // distance_to_rider weight (km)
  w2: number; // estimated_pickup_time weight (seconds)
  w3: number; // driver_idle_time weight (seconds) - negative prefers idle drivers
  w4: number; // driver_rating_penalty weight (0-5 scale)
  w5: number; // cancellation_risk weight (0-1 scale)
  w6: number; // surge_priority weight (1-N scale) - negative prefers surge drivers
}

/**
 * Default matching weights (production tuned)
 * 
 * Prioritization (from highest to lowest weight):
 * 1. Cancellation Risk (10.0) - avoid unreliable drivers
 * 2. Rating Penalty (5.0) - prefer highly rated drivers
 * 3. Distance (1.0) - prefer nearby drivers
 * 4. Pickup Time (0.01) - prefer quick availability
 * 5. Idle Time (-0.001) - slight preference for idle drivers
 * 6. Surge Priority (-0.5) - prefer drivers in high-demand zones
 */
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  w1: 1.0,    // Distance: 1 point per km
  w2: 0.01,   // Pickup time: 0.01 point per second (~3 per minute)
  w3: -0.001, // Idle time: negative = prefer idle drivers
  w4: 5.0,    // Rating penalty: 5 points per 1.0 rating decrease from 5.0
  w5: 10.0,   // Cancellation: 10 points per 0.1 cancellation rate
  w6: -0.5,   // Surge priority: negative = prefer surge zone drivers
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate rating penalty
 * Higher penalty for lower ratings
 * 
 * Examples:
 * - Rating 5.0 → penalty = 0.0
 * - Rating 4.5 → penalty = 2.5
 * - Rating 4.0 → penalty = 5.0
 * - Rating 3.0 → penalty = 10.0
 * - Rating < 2.5 → capped at penalty = 12.5
 */
function calculateRatingPenalty(rating: number): number {
  const normalizedRating = Math.max(0, Math.min(rating, 5.0));
  return 5.0 - normalizedRating;
}

/**
 * Calculate cancellation risk
 * Proportional to the driver's cancellation rate
 * 
 * Examples:
 * - 0% cancellation rate → risk = 0.0
 * - 5% cancellation rate → risk = 0.5
 * - 10% cancellation rate → risk = 1.0
 */
function calculateCancellationRisk(cancellationRate: number): number {
  const normalizedRate = Math.max(0, Math.min(cancellationRate, 1.0));
  return normalizedRate * 10; // Scale to 0-10
}

/**
 * Main scoring function for a single driver
 * 
 * @param driver - Driver object with all metrics
 * @param pickupLocation - Rider's pickup location
 * @param config - Matching configuration (weights)
 * @returns score where LOWER is BETTER
 */
export function calculateDriverScore(
  driver: Driver,
  pickupLocation: Location,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): number {
  // Guard: Driver must have a current location
  if (!driver.current_location) {
    return Infinity; // Driver with no location is not available
  }

  // 1. Calculate distance to rider (in km)
  const distance = calculateDistance(
    driver.current_location.latitude,
    driver.current_location.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );

  // 2. Get driver's estimated pickup time (in seconds)
  const pickupTime = driver.estimated_pickup_time_seconds || 300; // Default 5 minutes

  // 3. Get driver's idle time (in seconds)
  const idleTime = driver.idle_time_seconds || 0;

  // 4. Calculate rating penalty (0-5 scale)
  const ratingPenalty = calculateRatingPenalty(driver.rating);

  // 5. Calculate cancellation risk (0-1 scale)
  const cancellationRisk = calculateCancellationRisk(
    driver.cancellation_rate || 0
  );

  // 6. Get surge zone priority (multiplier, typically 1.0-2.0)
  const surgePriority = driver.surge_zone_priority || 1.0;

  // Apply weighted formula
  const score =
    config.w1 * distance +
    config.w2 * pickupTime +
    config.w3 * idleTime +
    config.w4 * ratingPenalty +
    config.w5 * cancellationRisk +
    config.w6 * surgePriority;

  return score;
}

/**
 * Scored driver with detailed metrics (for debugging/analytics)
 */
export interface ScoredDriver {
  driver: Driver;
  score: number;
  distance_km: number;
  pickup_time_seconds: number;
  idle_time_seconds: number;
  rating_penalty: number;
  cancellation_risk: number;
  surge_priority: number;
}

/**
 * Score and rank all drivers
 * 
 * @param drivers - Array of candidate drivers
 * @param pickupLocation - Rider's pickup location
 * @param config - Matching configuration
 * @returns Array of scored drivers sorted by score (ascending)
 */
export function scoreDrivers(
  drivers: Driver[],
  pickupLocation: Location,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): ScoredDriver[] {
  const scored: ScoredDriver[] = drivers
    .filter((driver) => driver.status === 'online' && driver.current_location)
    .map((driver) => {
      const distance = calculateDistance(
        driver.current_location!.latitude,
        driver.current_location!.longitude,
        pickupLocation.latitude,
        pickupLocation.longitude
      );

      const pickupTime = driver.estimated_pickup_time_seconds || 300;
      const idleTime = driver.idle_time_seconds || 0;
      const ratingPenalty = calculateRatingPenalty(driver.rating);
      const cancellationRisk = calculateCancellationRisk(
        driver.cancellation_rate || 0
      );
      const surgePriority = driver.surge_zone_priority || 1.0;

      return {
        driver,
        score: calculateDriverScore(driver, pickupLocation, config),
        distance_km: distance,
        pickup_time_seconds: pickupTime,
        idle_time_seconds: idleTime,
        rating_penalty: ratingPenalty,
        cancellation_risk: cancellationRisk,
        surge_priority: surgePriority,
      };
    });

  // Sort by score (ascending - lower is better)
  return scored.sort((a, b) => a.score - b.score);
}

/**
 * Select the single best driver for a ride
 * 
 * @returns The driver with the lowest score, or null if no drivers available
 */
export function selectBestDriver(
  drivers: Driver[],
  pickupLocation: Location,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): Driver | null {
  const scored = scoreDrivers(drivers, pickupLocation, config);

  if (scored.length === 0) {
    return null;
  }

  return scored[0].driver;
}

/**
 * Get top N drivers ranked by score (for display/fallback logic)
 * 
 * @param topN - Number of top drivers to return
 * @returns Array of top N drivers with their scores
 */
export function getTopDrivers(
  drivers: Driver[],
  pickupLocation: Location,
  topN: number = 5,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): ScoredDriver[] {
  const scored = scoreDrivers(drivers, pickupLocation, config);
  return scored.slice(0, Math.min(topN, scored.length));
}

/**
 * Get detailed breakdown of scoring for a specific driver (for debugging)
 */
export function getDriverScoreBreakdown(
  driver: Driver,
  pickupLocation: Location,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): Record<string, number> {
  if (!driver.current_location) {
    return { error: 1 };
  }

  const distance = calculateDistance(
    driver.current_location.latitude,
    driver.current_location.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );

  const pickupTime = driver.estimated_pickup_time_seconds || 300;
  const idleTime = driver.idle_time_seconds || 0;
  const ratingPenalty = calculateRatingPenalty(driver.rating);
  const cancellationRisk = calculateCancellationRisk(
    driver.cancellation_rate || 0
  );
  const surgePriority = driver.surge_zone_priority || 1.0;

  return {
    total_score: calculateDriverScore(driver, pickupLocation, config),
    distance_component: config.w1 * distance,
    pickup_time_component: config.w2 * pickupTime,
    idle_time_component: config.w3 * idleTime,
    rating_penalty_component: config.w4 * ratingPenalty,
    cancellation_risk_component: config.w5 * cancellationRisk,
    surge_priority_component: config.w6 * surgePriority,
    raw_distance_km: distance,
    raw_pickup_time_seconds: pickupTime,
    raw_rating_penalty: ratingPenalty,
    raw_cancellation_risk: cancellationRisk,
  };
}
