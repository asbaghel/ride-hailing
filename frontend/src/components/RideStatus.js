import React, { useState, useEffect } from 'react';
import { rides, trips } from '../services/api';
import Payment from './Payment';
import '../styles/RideStatus.css';

function RideStatus({ rideId, onComplete }) {
  const [ride, setRide] = useState(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState('awaiting'); // awaiting, accepted, in_progress, completed, payment
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        const rideData = await rides.getStatus(rideId);
        setRide(rideData.data);

        // Determine step
        if (rideData.data.status === 'completed') {
          setCurrentStep('completed');
          if (rideData.data.trip_id) {
            const tripData = await trips.getTrip(rideData.data.trip_id);
            setTrip(tripData.data);
          }
        } else if (rideData.data.status === 'in_progress') {
          setCurrentStep('in_progress');
          if (rideData.data.trip_id) {
            const tripData = await trips.getTrip(rideData.data.trip_id);
            setTrip(tripData.data);
          }
        } else if (rideData.data.status === 'assigned') {
          setCurrentStep('accepted');
        } else {
          setCurrentStep('awaiting');
        }
      } catch (err) {
        setError('Failed to fetch ride status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRideStatus();

    // Poll every 3 seconds
    const interval = setInterval(fetchRideStatus, 3000);
    return () => clearInterval(interval);
  }, [rideId]);

  const handleEndTrip = async () => {
    if (!trip) return;
    try {
      setLoading(true);
      const result = await trips.endTrip(trip.id);
      if (result.success) {
        setTrip(result.data);
        setCurrentStep('completed');
      }
    } catch (err) {
      setError('Failed to end trip');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!trip) return;
    setShowPayment(true);
  };

  const handlePaymentComplete = async (paymentResult) => {
    if (paymentResult.success) {
      alert('🎉 Ride completed successfully!\n\nThank you for using our service!');
      onComplete && onComplete();
    }
  };

  // Show payment screen
  if (showPayment && trip) {
    return (
      <Payment
        tripId={trip.id}
        fareAmount={trip.fare_amount}
        pickupAddress={ride?.pickup_location?.address}
        dropoffAddress={ride?.dropoff_location?.address}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  if (loading && !ride) {
    return <div className="ride-status-loading">Loading ride status...</div>;
  }

  return (
    <div className="ride-status-container">
      <div className="ride-status-header">
        <h2>Ride Status</h2>
        <div className="ride-id">ID: {rideId}</div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {ride && (
        <div className="ride-status-content">
          <div className="status-timeline">
            <div className={`timeline-step ${currentStep === 'awaiting' || ['accepted', 'in_progress', 'completed'].includes(currentStep) ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Awaiting Driver</div>
            </div>
            <div className={`timeline-line ${['accepted', 'in_progress', 'completed'].includes(currentStep) ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${['accepted', 'in_progress', 'completed'].includes(currentStep) ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Driver Accepted</div>
            </div>
            <div className={`timeline-line ${['in_progress', 'completed'].includes(currentStep) ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${['in_progress', 'completed'].includes(currentStep) ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">In Progress</div>
            </div>
            <div className={`timeline-line ${currentStep === 'completed' ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${currentStep === 'completed' ? 'completed' : ''}`}>
              <div className="step-circle">4</div>
              <div className="step-label">Completed</div>
            </div>
          </div>

          <div className="ride-details">
            <div className="detail-section">
              <h3>📍 Pickup</h3>
              <p>{ride.pickup_location?.address || 'Loading...'}</p>
            </div>
            <div className="detail-section">
              <h3>📍 Dropoff</h3>
              <p>{ride.dropoff_location?.address || 'Loading...'}</p>
            </div>
            <div className="detail-section">
              <h3>Status</h3>
              <p className="status-badge">{ride.status.toUpperCase()}</p>
            </div>
          </div>

          {trip && (
            <div className="trip-details">
              <div className="detail-section">
                <h3>💰 Fare</h3>
                <p className="fare-amount">₹ {trip.fare_amount?.toFixed(2) || 'Calculating...'}</p>
              </div>
              <div className="detail-section">
                <h3>⏱️ Duration</h3>
                <p>{trip.duration_minutes ? `${trip.duration_minutes} min` : 'In progress'}</p>
              </div>
              <div className="detail-section">
                <h3>📏 Distance</h3>
                <p>{trip.distance_km?.toFixed(2) || 'Calculating...'} km</p>
              </div>
            </div>
          )}

          <div className="action-buttons">
            {currentStep === 'in_progress' && (
              <button className="btn btn-primary" onClick={handleEndTrip} disabled={loading}>
                {loading ? 'Ending Trip...' : 'End Trip'}
              </button>
            )}
            {currentStep === 'completed' && (
              <button className="btn btn-success" onClick={handlePayment} disabled={loading}>
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RideStatus;
