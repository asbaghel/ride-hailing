export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Ride {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: Location;
  dropoff_location: Location;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimated_fare?: number;
  actual_fare?: number;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  ended_at?: Date;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicle_number?: string;
  status: 'offline' | 'online' | 'on_trip';
  current_location?: Location;
  rating: number;
  total_rides: number;
  created_at: Date;
  updated_at: Date;
}

export interface Trip {
  id: string;
  ride_id: string;
  driver_id: string;
  distance_km?: number;
  duration_minutes?: number;
  fare: number;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  trip_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
