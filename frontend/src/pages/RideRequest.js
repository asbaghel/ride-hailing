import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RideRequest.css';

function RideRequest() {
  const [formData, setFormData] = useState({
    user_id: 'user_' + Math.random().toString(36).substr(2, 9),
    pickup_location: {
      latitude: '',
      longitude: '',
      address: '',
    },
    dropoff_location: {
      latitude: '',
      longitude: '',
      address: '',
    },
    estimated_fare: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rideId, setRideId] = useState('');

  const handleLocationChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.pickup_location.latitude ||
      !formData.pickup_location.longitude ||
      !formData.dropoff_location.latitude ||
      !formData.dropoff_location.longitude
    ) {
      setError('Please fill in all location coordinates');
      return false;
    }

    // Validate latitude/longitude ranges
    const validateCoords = (lat, lng) => {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
    };

    if (
      !validateCoords(
        formData.pickup_location.latitude,
        formData.pickup_location.longitude
      )
    ) {
      setError('Invalid pickup location coordinates');
      return false;
    }

    if (
      !validateCoords(
        formData.dropoff_location.latitude,
        formData.dropoff_location.longitude
      )
    ) {
      setError('Invalid dropoff location coordinates');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: formData.user_id,
        pickup_location: {
          latitude: parseFloat(formData.pickup_location.latitude),
          longitude: parseFloat(formData.pickup_location.longitude),
          address: formData.pickup_location.address,
        },
        dropoff_location: {
          latitude: parseFloat(formData.dropoff_location.latitude),
          longitude: parseFloat(formData.dropoff_location.longitude),
          address: formData.dropoff_location.address,
        },
        estimated_fare: formData.estimated_fare ? parseFloat(formData.estimated_fare) : null,
      };

      const response = await axios.post(
        'http://localhost:8000/v1/rides',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setRideId(response.data.data.id);
        // Reset form
        setFormData({
          user_id: 'user_' + Math.random().toString(36).substr(2, 9),
          pickup_location: {
            latitude: '',
            longitude: '',
            address: '',
          },
          dropoff_location: {
            latitude: '',
            longitude: '',
            address: '',
          },
          estimated_fare: '',
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to create ride request. Please try again.'
      );
      console.error('Error creating ride:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (type) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationChange(type, 'latitude', latitude.toString());
          handleLocationChange(type, 'longitude', longitude.toString());
        },
        (error) => {
          setError(`Failed to get ${type} location: ${error.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="ride-request-container">
      <div className="ride-request-header">
        <h1>Request a Ride</h1>
        <p>Enter your pickup and dropoff locations</p>
      </div>

      {success && (
        <div className="success-message">
          <h3>✓ Ride Request Created Successfully!</h3>
          <p>Ride ID: <strong>{rideId}</strong></p>
          <p>A driver will be assigned to your ride shortly.</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>✕</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ride-request-form">
        {/* User ID Section */}
        <div className="form-section">
          <label htmlFor="user_id">User ID</label>
          <input
            type="text"
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            disabled
            className="disabled-input"
          />
          <small>Auto-generated unique identifier</small>
        </div>

        {/* Pickup Location Section */}
        <div className="form-section">
          <h3>Pickup Location</h3>
          <button
            type="button"
            className="geolocation-btn"
            onClick={() => getCurrentLocation('pickup_location')}
          >
            📍 Use Current Location
          </button>

          <div className="location-inputs">
            <div className="input-group">
              <label htmlFor="pickup_lat">Latitude</label>
              <input
                type="number"
                id="pickup_lat"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="e.g., 40.7128"
                value={formData.pickup_location.latitude}
                onChange={(e) =>
                  handleLocationChange('pickup_location', 'latitude', e.target.value)
                }
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="pickup_lng">Longitude</label>
              <input
                type="number"
                id="pickup_lng"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="e.g., -74.0060"
                value={formData.pickup_location.longitude}
                onChange={(e) =>
                  handleLocationChange('pickup_location', 'longitude', e.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="pickup_addr">Address (Optional)</label>
            <input
              type="text"
              id="pickup_addr"
              placeholder="e.g., 123 Main St, New York"
              value={formData.pickup_location.address}
              onChange={(e) =>
                handleLocationChange('pickup_location', 'address', e.target.value)
              }
            />
          </div>
        </div>

        {/* Dropoff Location Section */}
        <div className="form-section">
          <h3>Dropoff Location</h3>
          <button
            type="button"
            className="geolocation-btn"
            onClick={() => getCurrentLocation('dropoff_location')}
          >
            📍 Use Current Location
          </button>

          <div className="location-inputs">
            <div className="input-group">
              <label htmlFor="dropoff_lat">Latitude</label>
              <input
                type="number"
                id="dropoff_lat"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="e.g., 40.7580"
                value={formData.dropoff_location.latitude}
                onChange={(e) =>
                  handleLocationChange('dropoff_location', 'latitude', e.target.value)
                }
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="dropoff_lng">Longitude</label>
              <input
                type="number"
                id="dropoff_lng"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="e.g., -73.9855"
                value={formData.dropoff_location.longitude}
                onChange={(e) =>
                  handleLocationChange('dropoff_location', 'longitude', e.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="dropoff_addr">Address (Optional)</label>
            <input
              type="text"
              id="dropoff_addr"
              placeholder="e.g., 456 Park Ave, New York"
              value={formData.dropoff_location.address}
              onChange={(e) =>
                handleLocationChange('dropoff_location', 'address', e.target.value)
              }
            />
          </div>
        </div>

        {/* Estimated Fare Section */}
        <div className="form-section">
          <label htmlFor="estimated_fare">Estimated Fare (Optional)</label>
          <input
            type="number"
            id="estimated_fare"
            name="estimated_fare"
            step="0.01"
            min="0"
            placeholder="e.g., 15.50"
            value={formData.estimated_fare}
            onChange={handleInputChange}
          />
          <small>If not provided, it will be calculated after trip completion</small>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Ride...' : 'Request Ride'}
        </button>
      </form>

      <div className="example-locations">
        <h4>📍 Example Coordinates:</h4>
        <ul>
          <li><strong>NYC Times Square:</strong> 40.7580, -73.9855</li>
          <li><strong>NYC Central Park:</strong> 40.7829, -73.9654</li>
          <li><strong>SF Golden Gate Bridge:</strong> 37.8199, -122.4783</li>
        </ul>
      </div>
    </div>
  );
}

export default RideRequest;
