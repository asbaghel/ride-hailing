import React, { useState } from 'react';
import axios from 'axios';
import LocationSelector from '../components/LocationSelector';
import '../styles/RideRequestFlow.css';

function RideRequest() {
  const [currentStep, setCurrentStep] = useState(1); // Step 1: pickup, Step 2: dropoff
  const [formData, setFormData] = useState({
    user_id: 'user_' + Math.random().toString(36).substr(2, 9),
    pickup_location: {
      address: '',
      latitude: '',
      longitude: '',
    },
    dropoff_location: {
      address: '',
      latitude: '',
      longitude: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rideId, setRideId] = useState('');

  const handlePickupSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      pickup_location: location,
    }));
    setCurrentStep(2);
  };

  const handleDropoffSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      dropoff_location: location,
    }));
  };

  const handleBackFromDropoff = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // Validate locations
    if (
      !formData.pickup_location.latitude ||
      !formData.pickup_location.longitude ||
      !formData.dropoff_location.latitude ||
      !formData.dropoff_location.longitude
    ) {
      setError('Please select both pickup and dropoff locations');
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
            address: '',
            latitude: '',
            longitude: '',
          },
          dropoff_location: {
            address: '',
            latitude: '',
            longitude: '',
          },
        });
        setCurrentStep(1);
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

  // Step 1: Pickup location selection
  if (currentStep === 1) {
    return <LocationSelector locationType="pickup" onLocationSelect={handlePickupSelect} />;
  }

  // Step 2: Dropoff location selection and confirmation
  return (
    <div className="ride-request-flow">
      <div className="step-indicator">
        <div className="step completed">
          <div className="step-number">1</div>
          <div className="step-label">Pickup</div>
        </div>
        <div className="step-line"></div>
        <div className="step active">
          <div className="step-number">2</div>
          <div className="step-label">Dropoff</div>
        </div>
      </div>

      {success && (
        <div className="success-message">
          <h3>✓ Ride Request Created Successfully!</h3>
          <p>
            Ride ID: <strong>{rideId}</strong>
          </p>
          <p>A driver will be assigned to your ride shortly.</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>✕</span>
          <p>{error}</p>
        </div>
      )}

      <div className="dropoff-section">
        <LocationSelector
          locationType="dropoff"
          onLocationSelect={handleDropoffSelect}
          initialLocation={formData.dropoff_location}
          referenceLocation={formData.pickup_location}
        />

        <div className="actions-container">
          <button className="back-btn" onClick={handleBackFromDropoff}>
            ← Back to Pickup
          </button>
          <button
            className="submit-ride-btn"
            onClick={handleSubmit}
            disabled={loading || !formData.dropoff_location.latitude}
          >
            {loading ? 'Creating Ride...' : 'Request Ride'}
          </button>
        </div>

        <div className="location-summary">
          <h3>Ride Summary</h3>
          <div className="summary-item">
            <div className="summary-label">
              <span className="summary-icon">🔴</span> Pickup
            </div>
            <div className="summary-value">
              {formData.pickup_location.address || 'Location selected'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">
              <span className="summary-icon">🔵</span> Dropoff
            </div>
            <div className="summary-value">
              {formData.dropoff_location.address || 'Select dropoff location'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RideRequest;
