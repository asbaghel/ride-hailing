import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RideRequest from './pages/RideRequest';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/request-ride" element={<RideRequest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
