import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Star, Plus, AlertCircle, RefreshCw, Compass, Building2, ShoppingBag, Coffee, BedDouble, Landmark, Utensils } from 'lucide-react';

const CATEGORY_ICONS = {
  restaurant: Utensils,
  market: ShoppingBag,
  cafe: Coffee,
  accommodation: BedDouble,
  cultural: Landmark,
};

const CATEGORY_COLORS = {
  restaurant: '#ef4444',
  market: '#f59e0b',
  cafe: '#8b5cf6',
  accommodation: '#3b82f6',
  cultural: '#10b981',
};

export default function Recommendations({ token, onSelectDestinationForTrip }) {
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
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
      setRecommendations(data.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecommendations();
    }
  }, [token]);

  const getStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          style={{
            fill: i <= Math.round(rating) ? 'var(--accent)' : 'none',
            color: i <= Math.round(rating) ? 'var(--accent)' : 'var(--border-color)',
          }}
        />
      );
    }
    return stars;
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(21, 28, 44, 1) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={24} style={{ color: 'var(--primary)' }} />
              <span>Tailored Places in Yaounde</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Places curated based on your saved interests & preference tags
            </p>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={fetchRecommendations} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
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
          <Compass size={40} className="brand-icon" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Calculating preference matches...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No recommendations yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Try updating your profile preferences to see tailored place ideas.
          </p>
        </div>
      ) : (
        <div className="grid">
          {recommendations.map((dest) => {
            const CatIcon = CATEGORY_ICONS[dest.category] || Building2;
            const catColor = CATEGORY_COLORS[dest.category] || 'var(--primary)';
            return (
              <div key={dest.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {dest.match_score > 0 && (
                  <div style={{ position: 'absolute', top: '-10px', right: '12px' }}>
                    <span className="badge badge-accent" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <Compass size={12} />
                      {dest.match_score} Preference Match{dest.match_score > 1 ? 'es' : ''}
                    </span>
                  </div>
                )}
                <div style={{ marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dest.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    <MapPin size={13} className="brand-icon" />
                    <span>{dest.address || dest.city}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem', flex: 1, lineHeight: 1.5 }}>
                  {dest.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.1rem' }}>
                    {getStars(dest.rating)}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {dest.rating}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-accent">
                    <DollarSign size={12} />
                    {dest.cost_per_day > 0 ? `${dest.cost_per_day} FCFA/day` : 'Free'}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: `${catColor}22`,
                      color: catColor,
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <CatIcon size={11} />
                    {dest.category}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {dest.tags.map((t) => (
                      <span key={t} className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                {onSelectDestinationForTrip && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    onClick={() => onSelectDestinationForTrip(dest)}
                  >
                    <Plus size={16} />
                    <span>Plan Visit</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
