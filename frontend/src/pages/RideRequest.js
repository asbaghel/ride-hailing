import React, { useState } from 'react';
import LocationSelector from '../components/LocationSelector';
import RideStatus from '../components/RideStatus';
import { rides } from '../services/api';
import '../styles/RideRequestFlow.css';

function RideRequest() {
  const [currentStep, setCurrentStep] = useState(1); // Step 1: pickup, Step 2: dropoff, Step 3: confirmation
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
    // Move to confirmation step
    setCurrentStep(3);
  };

  const handleBackFromDropoff = () => {
    setCurrentStep(1);
  };

  const handleBackFromConfirmation = () => {
    setCurrentStep(2);
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
      const response = await rides.create(
        formData.pickup_location,
        formData.dropoff_location,
        formData.user_id
      );

      if (response.success) {
        setSuccess(true);
        setRideId(response.data.id);
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
      } else {
        setError(response.error || 'Failed to create ride request');
      }
    } catch (err) {
      setError('Failed to create ride request. Please try again.');
      console.error('Error creating ride:', err);
    } finally {
      setLoading(false);
    }
  };

  // If ride is successfully created, show ride status
  if (success && rideId) {
    return (
      <RideStatus
        rideId={rideId}
        onComplete={() => {
          setSuccess(false);
          setRideId('');
          setCurrentStep(1);
        }}
      />
    );
  }

  // Step 1: Pickup location selection
  if (currentStep === 1) {
    return <LocationSelector locationType="pickup" onLocationSelect={handlePickupSelect} />;
  }

  // Step 2: Dropoff location selection
  if (currentStep === 2) {
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
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-label">Confirm</div>
          </div>
        </div>

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
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (currentStep === 3) {
    return (
      <div className="ride-request-flow">
        <div className="step-indicator">
          <div className="step completed">
            <div className="step-number">1</div>
            <div className="step-label">Pickup</div>
          </div>
          <div className="step-line"></div>
          <div className="step completed">
            <div className="step-number">2</div>
            <div className="step-label">Dropoff</div>
          </div>
          <div className="step-line"></div>
          <div className="step active">
            <div className="step-number">3</div>
            <div className="step-label">Confirm</div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>✕</span>
            <p>{error}</p>
          </div>
        )}

        <div className="confirmation-section">
          <h2>Confirm Your Ride</h2>
          
          <div className="location-details">
            <div className="location-card pickup-card">
              <div className="location-header">
                <span className="location-icon">🔴</span>
                <span className="location-type">Pickup Location</span>
              </div>
              <div className="location-address">
                {formData.pickup_location.address || 'Location selected'}
              </div>
              <div className="location-coords">
                {formData.pickup_location.latitude}, {formData.pickup_location.longitude}
              </div>
            </div>

            <div className="route-arrow">↓</div>

            <div className="location-card dropoff-card">
              <div className="location-header">
                <span className="location-icon">🔵</span>
                <span className="location-type">Dropoff Location</span>
              </div>
              <div className="location-address">
                {formData.dropoff_location.address || 'Location selected'}
              </div>
              <div className="location-coords">
                {formData.dropoff_location.latitude}, {formData.dropoff_location.longitude}
              </div>
            </div>
          </div>

          <div className="actions-container">
            <button className="back-btn" onClick={handleBackFromConfirmation}>
              ← Edit Locations
            </button>
            <button
              className="submit-ride-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Booking Ride...' : '🚗 Book Ride'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export default RideRequest;
