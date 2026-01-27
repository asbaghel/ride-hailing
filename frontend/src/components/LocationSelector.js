import React, { useState, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import '../styles/LocationSelector.css';

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

function LocationSelector({ locationType, onLocationSelect, initialLocation }) {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const updateLocationRef = useRef(null);
  const updateLocationFromClickRef = useRef(null);

  const markerColor = locationType === 'pickup' ? '#ef4444' : '#3b82f6';
  const markerLabel = locationType === 'pickup' ? '🔴 Pickup' : '🔵 Dropoff';
  const pageTitle = locationType === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location';

  const updateMarker = useCallback((lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: markerColor,
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapInstanceRef.current);

      markerRef.current = marker;
    }

    mapInstanceRef.current.setView([lat, lng], 19);
  }, [markerColor]);

  const updateLocation = useCallback((lat, lng, locationAddress) => {
    const location = {
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: locationAddress || '',
    };
    setSelectedLocation(location);
    updateMarker(lat, lng);
  }, [updateMarker]);

  const updateLocationFromClick = useCallback((lat, lng) => {
    const location = {
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: '',
    };
    setSelectedLocation(location);
    updateMarker(lat, lng);
  }, [updateMarker]);

  // Store callback refs for use in map event listeners
  useEffect(() => {
    updateLocationRef.current = updateLocation;
    updateLocationFromClickRef.current = updateLocationFromClick;
  }, [updateLocation, updateLocationFromClick]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Default center: Delhi, India
    const defaultCenter = [28.6139, 77.2090];
    const leafletMap = L.map(mapRef.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    // Set initial view
    leafletMap.setView(defaultCenter, 17);

    // Add current location marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([latitude, longitude], 19);
              L.circleMarker([latitude, longitude], {
                radius: 10,
                fillColor: '#0ea5e9',
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8,
              })
                .bindPopup('📍 Your Current Location')
                .addTo(mapInstanceRef.current);
            }
          }, 500);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

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

    // Handle map clicks
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateLocationFromClickRef.current(lat, lng);
    });

    mapInstanceRef.current = leafletMap;

    return () => {
      leafletMap.remove();
    };
  }, []);

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch('http://localhost:8000/v1/locations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, limit: 3 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data || []);
        setShowSuggestions(true);
      } else {
        console.error('API error:', result.error);
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  };

  const handleSearchInput = (value) => {
    setAddress(value);
    if (value.trim().length > 2) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const { lat, lon, display_name } = suggestion;
    setAddress(display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    updateLocationRef.current(parseFloat(lat), parseFloat(lon), display_name);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  return (
    <div className="location-selector-container">
      <div className="location-selector-header">
        <h1>{pageTitle}</h1>
        <p>Click on map or search to select {locationType} location</p>
      </div>

      <div className="location-selector-content">
        <div className="map-section">
          <div id="map" ref={mapRef} className="map-container"></div>
          <div className="map-info">
            <p>👆 Click on map to set location or use search above</p>
          </div>
        </div>

        <div className="form-section">
          <div className="location-card">
            <h3>{markerLabel} Location</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder={`Search ${locationType} location...`}
                value={address}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="suggestion-icon">📍</div>
                      <div className="suggestion-text">
                        <div className="suggestion-name">
                          {suggestion.display_name.split(',')[0]}
                        </div>
                        <div className="suggestion-address">
                          {suggestion.display_name.split(',').slice(1, 3).join(',')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedLocation?.latitude && (
              <p className="location-set">✓ Location set</p>
            )}
          </div>

          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedLocation?.latitude}
          >
            Confirm {locationType === 'pickup' ? 'Pickup' : 'Dropoff'} Location
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationSelector;
