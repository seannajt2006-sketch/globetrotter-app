import React, { useState, useEffect } from 'react';
import { Map, Calendar, MapPin, CheckSquare, FileText, AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';

export default function ViewItineraries({ token, onPlanNewTrip }) {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch itineraries');
      }

      setItineraries(data.data || []);
    } catch (err) {
      setError(err.message || 'Error communicating with itinerary service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItineraries();
    }
  }, [token]);

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={24} className="brand-icon" />
              <span>My Yaounde Visit Plans</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              View and manage your upcoming visit plans for places in Yaounde
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={fetchItineraries} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={onPlanNewTrip}>
              <PlusCircle size={16} />
              <span>New Visit</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Map size={40} className="brand-icon" style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your saved visit plans...</p>
        </div>
      ) : itineraries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Map size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No visit plans yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '400px', margin: '0.4rem auto 1.5rem' }}>
            You haven't planned any visits yet. Start exploring places in Yaounde or create a new visit plan!
          </p>
          <button className="btn btn-primary" onClick={onPlanNewTrip}>
            <PlusCircle size={18} />
            <span>Plan Your First Visit</span>
          </button>
        </div>
      ) : (
        <div className="grid">
          {itineraries.map((it) => (
            <div key={it.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                  <MapPin size={12} />
                  {it.destination}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{it.title}</h3>
              </div>

              {(it.start_date || it.end_date) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                  <Calendar size={15} />
                  <span>
                    {it.start_date || 'TBD'} &rarr; {it.end_date || 'TBD'}
                  </span>
                </div>
              )}

              {it.activities && it.activities.length > 0 && (
                <div style={{ marginBottom: '1rem', flex: 1 }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckSquare size={14} /> Planned Activities ({it.activities.length})
                  </h4>
                  <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {it.activities.map((act, idx) => (
                      <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-main)', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--primary)' }}>&bull;</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {it.notes && (
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={12} /> Notes
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                    {it.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
