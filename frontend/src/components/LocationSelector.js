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

function LocationSelector({ locationType, onLocationSelect, initialLocation, referenceLocation }) {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isGeocodingPending, setIsGeocodingPending] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const updateLocationRef = useRef(null);
  const updateLocationFromClickRef = useRef(null);

  const markerColor = locationType === 'pickup' ? '#ef4444' : '#3b82f6';
  const markerLabel = locationType === 'pickup' ? '🔴 Pickup' : '🔵 Dropoff';
  const pageTitle = locationType === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location';

  const createCustomIcon = useCallback((color) => {
    return L.divIcon({
      html: `<div style="position: relative; width: 40px; height: 40px; cursor: grab;" title="Drag to move">
        <div style="font-size: 32px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          ${locationType === 'pickup' ? '📍' : '📍'}
        </div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      className: 'pin-marker',
    });
  }, [locationType]);

  const updateMarker = useCallback((lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(markerColor),
        draggable: true,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`📍 ${markerLabel}`)
        .on('dragend', (e) => {
          const { lat: newLat, lng: newLng } = e.target.getLatLng();
          updateLocationFromClickRef.current(newLat, newLng);
        });

      markerRef.current = marker;
    }

    mapInstanceRef.current.setView([lat, lng], 19);
  }, [markerColor, markerLabel, createCustomIcon]);

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
    setIsGeocodingPending(true);
    updateMarker(lat, lng);
    
    // Perform reverse geocoding to get address
    reverseGeocodeLocation(lat, lng, location);
  }, [updateMarker]);

  const reverseGeocodeLocation = async (lat, lng, locationObj = null) => {
    try {
      const response = await fetch('http://localhost:8000/v1/locations/reverse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Use address if available, otherwise show lat/long
        const displayAddress = result.data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAddress(displayAddress);
        
        // Also update the selectedLocation object with the address
        setSelectedLocation((prev) => ({
          ...prev,
          address: displayAddress,
        }));
      } else {
        // Fallback to lat/long if no address found
        const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAddress(fallbackAddress);
        setSelectedLocation((prev) => ({
          ...prev,
          address: fallbackAddress,
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to lat/long on error
      const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(fallbackAddress);
      setSelectedLocation((prev) => ({
        ...prev,
        address: fallbackAddress,
      }));
    } finally {
      setIsGeocodingPending(false);
    }
  };

  // Store callback refs for use in map event listeners
  useEffect(() => {
    updateLocationRef.current = updateLocation;
    updateLocationFromClickRef.current = updateLocationFromClick;
  }, [updateLocation, updateLocationFromClick]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Ensure the DOM is ready
    const timer = setTimeout(() => {
      // Default center: Delhi, India
      const defaultCenter = [28.6139, 77.2090];
      
      try {
        const leafletMap = L.map(mapRef.current, {
          preferCanvas: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(leafletMap);

        // Set initial view - for dropoff with reference location, use reference location; otherwise use default
        let mapCenter = defaultCenter;
        if (referenceLocation && locationType === 'dropoff') {
          mapCenter = [parseFloat(referenceLocation.latitude), parseFloat(referenceLocation.longitude)];
        } else if (initialLocation) {
          mapCenter = [parseFloat(initialLocation.latitude), parseFloat(initialLocation.longitude)];
        }
        leafletMap.setView(mapCenter, 17);

        // Add draggable marker for location selection
        const initialLat = initialLocation?.latitude ? parseFloat(initialLocation.latitude) : mapCenter[0];
        const initialLng = initialLocation?.longitude ? parseFloat(initialLocation.longitude) : mapCenter[1];
        
        const draggableMarker = L.marker([initialLat, initialLng], {
          icon: createCustomIcon(markerColor),
          draggable: true,
        })
          .addTo(leafletMap)
          .bindPopup(`📍 ${markerLabel} - Drag to move`)
          .openPopup();

        draggableMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          updateLocationFromClickRef.current(lat, lng);
          e.target.openPopup();
        });

        markerRef.current = draggableMarker;
        mapInstanceRef.current = leafletMap;

        // Get current location and center map on it
        if (navigator.geolocation && !initialLocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              if (mapInstanceRef.current && markerRef.current) {
                // Determine reference location: use provided referenceLocation, or current location, or Delhi
                let refLat = latitude;
                let refLng = longitude;
                
                if (referenceLocation) {
                  refLat = parseFloat(referenceLocation.latitude);
                  refLng = parseFloat(referenceLocation.longitude);
                }
                
                // Offset the draggable marker ~1-2 meters northeast from reference location
                // 0.000015 degrees ≈ 1-2 meters at this latitude
                const offsetLat = refLat + 0.000015;
                const offsetLng = refLng + 0.000015;
                
                // Move draggable marker to offset position
                markerRef.current.setLatLng([offsetLat, offsetLng]);
                
                // Always center map on current location to show where user is
                mapInstanceRef.current.setView([latitude, longitude], 17);
                
                // Add current location marker
                L.marker([latitude, longitude], {
                  icon: L.divIcon({
                    html: `<div style="background-color: #0ea5e9; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"></div>`,
                    iconSize: [24, 24],
                    className: 'current-location-marker',
                  }),
                })
                  .bindPopup('📍 Your Current Location')
                  .addTo(mapInstanceRef.current);
                
                // Add reference location marker if dropoff and pickup is selected
                if (referenceLocation && locationType === 'dropoff') {
                  L.marker([refLat, refLng], {
                    icon: L.divIcon({
                      html: `<div style="font-size: 28px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 32],
                      className: 'reference-location-marker',
                    }),
                  })
                    .bindPopup('📍 Pickup Location')
                    .addTo(mapInstanceRef.current);
                }
              }
            },
            (error) => {
              console.log('Geolocation error:', error);
              // Fall back to Delhi if geolocation fails
              leafletMap.setView([initialLat, initialLng], 17);
            }
          );
        } else {
          // Use initial location or default to Delhi
          leafletMap.setView([initialLat, initialLng], 17);
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

        // Handle map clicks to move marker
        leafletMap.on('click', (e) => {
          const { lat, lng } = e.latlng;
          updateLocationFromClickRef.current(lat, lng);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [markerColor, markerLabel, initialLocation, referenceLocation, locationType, createCustomIcon]);

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
            <div className="map-instructions">
              <div className="map-instructions-icon">✋</div>
              <div className="map-instructions-text">
                Drag the {markerLabel.toLowerCase()} marker or click on map to move it. Use search to find exact location.
              </div>
            </div>
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
            disabled={!selectedLocation?.latitude || isGeocodingPending}
          >
            {isGeocodingPending ? 'Getting Address...' : `Confirm ${locationType === 'pickup' ? 'Pickup' : 'Dropoff'} Location`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationSelector;
