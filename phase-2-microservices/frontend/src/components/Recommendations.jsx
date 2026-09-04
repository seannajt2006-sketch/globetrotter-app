import React, { useState, useEffect } from 'react';
import { Sparkles, Star, MapPin, Plus, RefreshCw, Navigation } from 'lucide-react';

export default function Recommendations({ token, onAuthFailure, onSelectDestinationForTrip, onViewDestination, onGetDirections }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/recommendations?limit=6', {
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
        throw new Error(data.message || 'Failed to generate recommendations');
      }

      setRecommendations(data.data || []);
    } catch (err) {
      setError(err.message || 'Could not fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [token]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ color: 'var(--primary)' }} size={24} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Personalized Recommendations</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Powered by Recommendation Service & User Preference Matching
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchRecommendations} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Computing preference match scores across microservices...
        </div>
      ) : (
        <div className="grid">
          {recommendations.map((dest) => (
            <div
              key={dest.id}
              className="card card-clickable"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
              onClick={() => onViewDestination(dest)}
            >
              {dest.match_score > 0 && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                  <span className="badge badge-primary" style={{ boxShadow: 'var(--shadow-md)' }}>
                    🎯 {dest.match_score} Tag Match{dest.match_score > 1 ? 'es' : ''}
                  </span>
                </div>
              )}

              {dest.image_url && (
                <div style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img src={dest.image_url} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dest.name}</h3>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} /> {dest.address || 'Yaoundé'}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>
                {dest.description}
              </p>

              <div className="chip-group" style={{ marginBottom: '1rem' }}>
                {dest.tags?.slice(0, 4).map((t) => (
                  <span key={t} className="chip" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>#{t}</span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Cost</span>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                    {dest.cost_per_day > 0 ? `${dest.cost_per_day.toLocaleString()} XAF` : 'Free'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    onClick={(e) => { e.stopPropagation(); onGetDirections(dest); }}
                  >
                    <Navigation size={16} />
                    <span>Directions</span>
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    onClick={(e) => { e.stopPropagation(); onSelectDestinationForTrip(dest); }}
                  >
                    <Plus size={16} />
                    <span>Plan Trip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
