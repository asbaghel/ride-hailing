// API Service - Centralized API calls
const API_BASE_URL = 'http://localhost:8000/v1';

// Rides API
export const rides = {
  create: async (pickupLocation, dropoffLocation) => {
    const response = await fetch(`${API_BASE_URL}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
      }),
    });
    return response.json();
  },

  getStatus: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  cancel: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};

// Drivers API
export const drivers = {
  updateLocation: async (driverId, latitude, longitude) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });
    return response.json();
  },

  acceptRide: async (driverId, rideId) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: rideId }),
    });
    return response.json();
  },

  getDriver: async (driverId) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};

// Trips API
export const trips = {
  endTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  getTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};

// Payments API
export const payments = {
  create: async (tripId, amount, paymentMethod) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_id: tripId,
        amount,
        payment_method: paymentMethod,
      }),
    });
    return response.json();
  },

  getPayment: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  getPaymentByTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/payments/trip/${tripId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};

// Locations API
export const locations = {
  search: async (query, limit = 3) => {
    const response = await fetch(`${API_BASE_URL}/locations/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, limit }),
    });
    return response.json();
  },

  reverse: async (latitude, longitude) => {
    const response = await fetch(`${API_BASE_URL}/locations/reverse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });
    return response.json();
  },
};
