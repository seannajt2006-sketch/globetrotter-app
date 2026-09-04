import React, { useState, useEffect, useRef } from 'react';
import { Locate, Navigation, MapPin, X, Loader2 } from 'lucide-react';
import MapComponent from './MapComponent';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MapExplorer({ focusDestination = null }) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routePath, setRoutePath] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const consumedFocusIdRef = useRef(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/destinations');
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load destinations');
        setDestinations(data.data || []);
      } catch (err) {
        setError(err.message || 'Error connecting to Recommendation Service');
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const selectedDestination = destinations.find((d) => d.id === selectedId)
    || (focusDestination?.id === selectedId ? focusDestination : null);

  const handleSelectDestination = (dest) => {
    setSelectedId(dest.id === selectedId ? null : dest.id);
    setRoutePath(null);
    setRouteInfo(null);
  };

  // Deep-link support: jump straight to a destination passed in from a card/detail page,
  // requesting the user's location and fetching directions automatically.
  useEffect(() => {
    if (focusDestination && consumedFocusIdRef.current !== focusDestination.id) {
      consumedFocusIdRef.current = focusDestination.id;
      setSelectedId(focusDestination.id);
      setRoutePath(null);
      setRouteInfo(null);
      if (!userLocation) {
        handleUseMyLocation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDestination]);

  useEffect(() => {
    if (focusDestination && userLocation && selectedId === focusDestination.id && !routePath && !routing) {
      handleGetDirections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, focusDestination, selectedId]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Unable to retrieve your location. Please check location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleGetDirections = async () => {
    if (!userLocation || !selectedDestination) return;
    setRouting(true);
    setError('');
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${selectedDestination.lng},${selectedDestination.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('Routing service unavailable');
      }
      const route = data.routes[0];
      setRoutePath(route.geometry.coordinates.map(([lon, lat]) => [lat, lon]));
      setRouteInfo({
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
        source: 'routed'
      });
    } catch (err) {
      // Fall back to a direct straight-line path when the routing service can't be reached
      const distanceKm = haversineKm(userLocation.lat, userLocation.lng, selectedDestination.lat, selectedDestination.lng).toFixed(1);
      setRoutePath([[userLocation.lat, userLocation.lng], [selectedDestination.lat, selectedDestination.lng]]);
      setRouteInfo({ distanceKm, durationMin: null, source: 'straight' });
    } finally {
      setRouting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Yaoundé Map Explorer</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse every destination on the map, find your location, and get directions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleUseMyLocation} disabled={locating}>
            {locating ? <Loader2 size={18} className="spin" /> : <Locate size={18} />}
            <span>{userLocation ? 'Update My Location' : 'Use My Location'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGetDirections}
            disabled={!userLocation || !selectedDestination || routing}
            title={!userLocation ? 'Share your location first' : !selectedDestination ? 'Pick a destination below' : 'Get directions'}
          >
            {routing ? <Loader2 size={18} className="spin" /> : <Navigation size={18} />}
            <span>Get Directions</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {routeInfo && selectedDestination && (
        <div className="alert" style={{ background: 'var(--primary-light)', color: 'var(--primary)', justifyContent: 'space-between' }}>
          <span>
            <Navigation size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            {routeInfo.durationMin != null
              ? `${routeInfo.distanceKm} km · ~${routeInfo.durationMin} min drive to ${selectedDestination.name}`
              : `${routeInfo.distanceKm} km direct line to ${selectedDestination.name} (routing service unavailable, showing straight path)`}
          </span>
          <button
            className="chat-reply-cancel"
            onClick={() => { setRoutePath(null); setRouteInfo(null); }}
            title="Clear route"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading destinations...
        </div>
      ) : (
        <>
          <MapComponent
            items={destinations}
            center={[3.8480, 11.5021]}
            zoom={13}
            userLocation={userLocation}
            routePath={routePath}
            highlightId={selectedId}
            fullHeight
          />

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Tap a destination to highlight it on the map, then get directions:
            </div>
            <div className="chip-group">
              {destinations.map((dest) => (
                <span
                  key={dest.id}
                  className={`chip ${selectedId === dest.id ? 'selected' : ''}`}
                  onClick={() => handleSelectDestination(dest)}
                >
                  <MapPin size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  {dest.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
