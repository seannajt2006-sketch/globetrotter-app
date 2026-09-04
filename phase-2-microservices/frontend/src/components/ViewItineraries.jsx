import React, { useState, useEffect } from 'react';
import { Map, Calendar, Plus, CheckCircle, MapPin, Navigation } from 'lucide-react';
import MapComponent from './MapComponent';

// Helper dictionary of known neighborhood / landmark coordinates in Yaoundé
const KNOWN_COORDS = {
  'bastos': { lat: 3.8900, lng: 11.5150 },
  'tsinga': { lat: 3.8820, lng: 11.5050 },
  'hippodrome': { lat: 3.8650, lng: 11.5180 },
  'centre administratif': { lat: 3.8600, lng: 11.5200 },
  'mokolo': { lat: 3.8750, lng: 11.4980 },
  'mvolyé': { lat: 3.8400, lng: 11.5080 },
  'mvog-betsi': { lat: 3.8450, lng: 11.4900 },
  'melen': { lat: 3.8580, lng: 11.4990 },
  'emana': { lat: 3.9100, lng: 11.5250 },
  'omnisport': { lat: 3.8800, lng: 11.5350 }
};

export default function ViewItineraries({ token, onAuthFailure, onPlanNewTrip }) {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);

  const fetchItineraries = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/itineraries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        onAuthFailure();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch itineraries');
      }

      setItineraries(data.data || []);
    } catch (err) {
      setError(err.message || 'Could not load your itineraries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, [token]);

  // Convert itineraries into route map pins
  const mapPins = itineraries.map((itin, index) => {
    const destName = itin.destination || itin.title;
    const destLower = destName.toLowerCase();

    // Default coordinate calculation with slight spread for visual clarity
    let lat = 3.8480 + (index * 0.015);
    let lng = 11.5021 + (index * 0.012);

    for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
      if (destLower.includes(key)) {
        lat = coords.lat;
        lng = coords.lng;
        break;
      }
    }

    return {
      id: itin.id,
      name: itin.title,
      address: itin.destination,
      category: 'cultural',
      cost_per_day: itin.activities?.length || 0,
      lat,
      lng
    };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Map style={{ color: 'var(--primary)' }} size={24} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Saved Trips & Itineraries</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Stored in Itinerary Service & Synchronized with Event Bus
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className={`btn ${showMap ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowMap(!showMap)}
          >
            <Navigation size={18} />
            <span>{showMap ? 'Hide Route Map' : 'Show Route Map'}</span>
          </button>
          <button className="btn btn-primary" onClick={onPlanNewTrip}>
            <Plus size={18} />
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>

      {/* Interactive Trip Route Map */}
      {showMap && mapPins.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            🗺️ Interactive Route Map — Plotted Itinerary Stops
          </div>
          <MapComponent items={mapPins} center={[3.8480, 11.5021]} zoom={12} showRoute={true} />
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your travel itineraries...
        </div>
      ) : itineraries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Map size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Itineraries Planned Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Start exploring places in Yaoundé and build your custom itinerary route!
          </p>
          <button className="btn btn-primary" onClick={onPlanNewTrip}>
            <Plus size={18} />
            <span>Create Your First Trip</span>
          </button>
        </div>
      ) : (
        <div className="grid">
          {itineraries.map((itin, idx) => (
            <div key={itin.id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <span className="badge badge-primary">Stop #{idx + 1}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {itin.id}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>{itin.title}</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.6rem', fontWeight: 600 }}>
                <MapPin size={16} />
                <span>{itin.destination}</span>
              </div>

              {(itin.start_date || itin.end_date) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <Calendar size={14} />
                  <span>{itin.start_date || 'TBD'} to {itin.end_date || 'TBD'}</span>
                </div>
              )}

              {itin.activities && itin.activities.length > 0 && (
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Activities
                  </div>
                  <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {itin.activities.map((act, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {itin.notes && (
                <div style={{ marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Notes:</strong> {itin.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
