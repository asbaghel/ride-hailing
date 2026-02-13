import React, { useState, useEffect } from 'react';
import { rides, trips } from '../services/api';
import Payment from './Payment';
import '../styles/RideStatus.css';

function RideStatus({ rideId, onComplete }) {
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState('awaiting'); // awaiting, accepted, in_progress, completed, payment
  const [showPayment, setShowPayment] = useState(false);
  const [demoSimulation, setDemoSimulation] = useState({
    driverAccepted: false,
    rideStarted: false,
  });

  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        const rideData = await rides.getStatus(rideId);
        let ride = rideData.data;

        // Parse locations if they're strings
        if (typeof ride.pickup_location === 'string') {
          ride.pickup_location = JSON.parse(ride.pickup_location);
        }
        if (typeof ride.dropoff_location === 'string') {
          ride.dropoff_location = JSON.parse(ride.dropoff_location);
        }

        setRide(ride);

        // Fetch driver details if driver_id exists
        if (ride.driver_id) {
          try {
            const driverRes = await fetch(`http://localhost:8000/v1/drivers/${ride.driver_id}`, {
              headers: { 'Content-Type': 'application/json' },
            });
            if (driverRes.ok) {
              const driverData = await driverRes.json();
              setDriver(driverData.data);
            }
          } catch (err) {
            console.error('Failed to fetch driver details:', err);
          }
        }

        // =====================================================
        // DEMO MODE: Simulate driver accepting and ride progression
        // In production, these status changes would come from the driver app
        // =====================================================
        
        // Simulate: After 3 seconds, driver accepts the ride (pending -> accepted)
        if (ride.status === 'pending' && !demoSimulation.driverAccepted) {
          console.log('📱 Demo: Driver accepting ride...');
          // In production: Driver would call POST /v1/drivers/{driverId}/accept
          setTimeout(async () => {
            try {
              if (ride.driver_id) {
                const response = await fetch(`http://localhost:8000/v1/drivers/${ride.driver_id}/accept`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ride_id: rideId }),
                });
                
                if (response.ok) {
                  setDemoSimulation(prev => ({ ...prev, driverAccepted: true }));
                  console.log('✅ Driver accepted ride');
                } else {
                  console.error('Failed to accept ride:', response.status);
                }
              }
            } catch (err) {
              console.error('Demo: Failed to accept ride:', err);
            }
          }, 3000);
        }

        // Simulate: After ride is accepted, automatically start the trip (accepted -> in_progress)
        if ((ride.status === 'accepted' || ride.status === 'assigned') && !demoSimulation.rideStarted) {
          console.log('🚗 Demo: Starting trip...');
          // In production: Driver would click "Start Trip" button
          setTimeout(async () => {
            try {
              // Call backend to update ride status to 'in_progress'
              await fetch(`http://localhost:8000/v1/rides/${rideId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress' }),
              });
              setDemoSimulation(prev => ({ ...prev, rideStarted: true }));
              console.log('✅ Trip started');
            } catch (err) {
              console.error('Demo: Failed to start trip:', err);
            }
          }, 4500);
        }

        // Automatically progress through steps based on ride status
        if (ride.status === 'completed') {
          setCurrentStep('completed');
          if (ride.trip_id) {
            const tripData = await trips.getTrip(ride.trip_id);
            setTrip(tripData.data);
          }
        } else if (ride.status === 'in_progress') {
          setCurrentStep('in_progress');
          if (ride.trip_id) {
            const tripData = await trips.getTrip(ride.trip_id);
            setTrip(tripData.data);
          }
        } else if (ride.status === 'accepted' || ride.status === 'assigned') {
          setCurrentStep('accepted');
        } else {
          // pending or any other status
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

    // Poll every 2 seconds for faster updates
    const interval = setInterval(fetchRideStatus, 2000);
    return () => clearInterval(interval);
  }, [rideId, demoSimulation]);

  const handleEndTrip = async () => {
    if (!trip) return;
    try {
      setLoading(true);
      const result = await trips.endTrip(trip.id);
      if (result.success) {
        setTrip(result.data);
        setCurrentStep('completed');
        
        // Free the driver - set status back to 'available'
        if (ride?.driver_id) {
          try {
            await fetch(`http://localhost:8000/v1/drivers/${ride.driver_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'available' }),
            });
            console.log('✅ Driver freed and set to available');
          } catch (err) {
            console.error('Failed to free driver:', err);
          }
        }
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
            
            {driver && (
              <>
                <div className="detail-section">
                  <h3>👨‍💼 Driver Name</h3>
                  <p>{driver.name || 'N/A'}</p>
                </div>
                <div className="detail-section">
                  <h3>🚗 Vehicle Number</h3>
                  <p>{driver.vehicle_number || 'N/A'}</p>
                </div>
              </>
            )}
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
