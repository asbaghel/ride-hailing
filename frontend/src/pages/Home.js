import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home-container">
      <header className="header">
        <h1>🚗 RideHub</h1>
        <p>India's Fastest Growing Ride Hailing Service</p>
      </header>
      
      <main className="main-content">
        <section className="hero">
          <div className="hero-content">
            <h2>Welcome to RideHub</h2>
            <p>Request a ride in seconds and get to your destination safely</p>
          </div>
        </section>

        <section className="cta-section">
          <Link to="/request-ride" className="btn btn-primary">
            🧑 Book a Ride as Passenger
          </Link>
          <button className="btn btn-secondary" disabled>
            🚗 Driver Features (Coming Soon)
          </button>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>✓ Quick Booking</h3>
            <p>Book a ride with location selection on map</p>
          </div>
          <div className="feature-card">
            <h3>✓ Real-time Updates</h3>
            <p>Track your ride status in real-time</p>
          </div>
          <div className="feature-card">
            <h3>✓ Safe Payment</h3>
            <p>Multiple secure payment options</p>
          </div>
          <div className="feature-card">
            <h3>✓ Best Prices</h3>
            <p>Transparent and fair pricing</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 RideHub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
