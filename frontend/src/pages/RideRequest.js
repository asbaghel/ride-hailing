import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import '../styles/RideRequest.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

function RideRequest() {
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
  const [selectedType, setSelectedType] = useState('pickup');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const updateLocationRef = useRef(null);
  const updateLocationFromClickRef = useRef(null);

  const updateMarker = useCallback((lat, lng, type) => {
    const markerRef = type === 'pickup' ? pickupMarkerRef : dropoffMarkerRef;
    const markerColor = type === 'pickup' ? '#ef4444' : '#3b82f6';

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: markerColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapInstanceRef.current);

      markerRef.current = marker;
    }

    mapInstanceRef.current.setView([lat, lng], 14);
  }, []);

  const updateLocation = useCallback((lat, lng, address) => {
    const newLat = typeof lat === 'number' ? lat : lng;
    const newLng = typeof lat === 'number' ? lng : lat;

    setFormData((prev) => ({
      ...prev,
      [selectedType === 'pickup' ? 'pickup_location' : 'dropoff_location']: {
        address: address || '',
        latitude: newLat.toString(),
        longitude: newLng.toString(),
      },
    }));

    updateMarker(newLat, newLng, selectedType);
  }, [selectedType, updateMarker]);

  const updateLocationFromClick = useCallback((lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      [selectedType === 'pickup' ? 'pickup_location' : 'dropoff_location']: {
        address: '',
        latitude: lat.toString(),
        longitude: lng.toString(),
      },
    }));

    updateMarker(lat, lng, selectedType);
  }, [selectedType, updateMarker]);

  // Store callback refs for use in map event listeners
  useEffect(() => {
    updateLocationRef.current = updateLocation;
    updateLocationFromClickRef.current = updateLocationFromClick;
  }, [updateLocation, updateLocationFromClick]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const leafletMap = L.map(mapRef.current).setView([40.7128, -74.006], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    // Add search control
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'button',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      openMarkersSidebar: false,
      maxMarkers: 5,
    });

    leafletMap.addControl(searchControl);

    leafletMap.on('geosearch/showlocation', (result) => {
      const { x, y, label } = result.location;
      updateLocationRef.current(x, y, label);
    });

    // Handle map clicks for location selection
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateLocationFromClickRef.current(lat, lng);
    });

    mapInstanceRef.current = leafletMap;

    return () => {
      leafletMap.remove();
    };
  }, []);

  const handleSearchInput = (value, type) => {
    setFormData((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickup_location' : 'dropoff_location']: {
        ...prev[type === 'pickup' ? 'pickup_location' : 'dropoff_location'],
        address: value,
      },
    }));

    // Fetch suggestions
    if (value.trim().length > 2) {
      fetchSuggestions(value, type);
    } else {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
    }
  };

  const fetchSuggestions = async (query, type) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=3`
      );
      const results = await response.json();

      if (type === 'pickup') {
        setPickupSuggestions(results);
        setShowPickupSuggestions(true);
      } else {
        setDropoffSuggestions(results);
        setShowDropoffSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleSelectSuggestion = (suggestion, type) => {
    const { lat, lon, display_name } = suggestion;
    setFormData((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickup_location' : 'dropoff_location']: {
        address: display_name,
        latitude: lat.toString(),
        longitude: lon.toString(),
      },
    }));

    if (type === 'pickup') {
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    } else {
      setShowDropoffSuggestions(false);
      setDropoffSuggestions([]);
    }

    setSelectedType(type === 'pickup' ? 'pickup' : 'dropoff');
    updateLocationRef.current(parseFloat(lat), parseFloat(lon), display_name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate locations
    if (
      !formData.pickup_location.latitude ||
      !formData.pickup_location.longitude ||
      !formData.dropoff_location.latitude ||
      !formData.dropoff_location.longitude
    ) {
      setError('Please select both pickup and dropoff locations on the map');
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
        if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
        if (dropoffMarkerRef.current) dropoffMarkerRef.current.remove();
        pickupMarkerRef.current = null;
        dropoffMarkerRef.current = null;
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

  return (
    <div className="ride-request-container">
      <div className="ride-request-header">
        <h1>Request a Ride</h1>
        <p>Select your pickup and dropoff locations</p>
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

      <div className="ride-request-content">
        <div className="map-section">
          <div className="map-controls">
            <button
              className={`location-btn ${selectedType === 'pickup' ? 'active' : ''}`}
              onClick={() => setSelectedType('pickup')}
            >
              📍 Pickup
            </button>
            <button
              className={`location-btn ${selectedType === 'dropoff' ? 'active' : ''}`}
              onClick={() => setSelectedType('dropoff')}
            >
              📍 Dropoff
            </button>
          </div>
          <div id="map" ref={mapRef} className="map-container"></div>
          <div className="map-info">
            <p>👆 Click on map to set location or use search above</p>
          </div>
        </div>

        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="location-card">
              <h3>🔴 Pickup Location</h3>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search pickup location..."
                  value={formData.pickup_location.address}
                  onChange={(e) =>
                    handleSearchInput(e.target.value, 'pickup')
                  }
                  onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                />
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {pickupSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(suggestion, 'pickup')}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-text">
                          <div className="suggestion-name">{suggestion.display_name.split(',')[0]}</div>
                          <div className="suggestion-address">{suggestion.display_name.split(',').slice(1, 3).join(',')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.pickup_location.latitude && (
                <p className="location-set">✓ Location set</p>
              )}
            </div>

            <div className="location-card">
              <h3>🔵 Dropoff Location</h3>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search dropoff location..."
                  value={formData.dropoff_location.address}
                  onChange={(e) =>
                    handleSearchInput(e.target.value, 'dropoff')
                  }
                  onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffSuggestions(true)}
                />
                {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {dropoffSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(suggestion, 'dropoff')}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-text">
                          <div className="suggestion-name">{suggestion.display_name.split(',')[0]}</div>
                          <div className="suggestion-address">{suggestion.display_name.split(',').slice(1, 3).join(',')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.dropoff_location.latitude && (
                <p className="location-set">✓ Location set</p>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Ride...' : 'Request Ride'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RideRequest;
