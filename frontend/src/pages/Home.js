import React from 'react';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home-container">
      <header className="header">
        <h1>Ride Hailing Service</h1>
        <p>Get where you need to go</p>
      </header>
      
      <main className="main-content">
        <section className="hero">
          <div className="hero-content">
            <h2>Welcome to Our Ride Hailing App</h2>
            <p>Request a ride in seconds and get to your destination safely</p>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>Quick Booking</h3>
            <p>Book a ride in just a few taps</p>
          </div>
          <div className="feature-card">
            <h3>Safe Travel</h3>
            <p>Travel safely with our verified drivers</p>
          </div>
          <div className="feature-card">
            <h3>Best Prices</h3>
            <p>Competitive pricing for all routes</p>
          </div>
        </section>

        <section className="cta-section">
          <button className="btn btn-primary">Book a Ride</button>
          <button className="btn btn-secondary">Become a Driver</button>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Ride Hailing Service. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
