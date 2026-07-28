import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, DollarSign, Star, Plus, AlertCircle, RefreshCw, Building2, ShoppingBag, Coffee, BedDouble, Landmark, Utensils } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: Building2 },
  { value: 'restaurant', label: 'Restaurants', icon: Utensils },
  { value: 'market', label: 'Markets', icon: ShoppingBag },
  { value: 'cafe', label: 'Cafes', icon: Coffee },
  { value: 'accommodation', label: 'Hotels', icon: BedDouble },
  { value: 'cultural', label: 'Cultural Sites', icon: Landmark },
];

const POPULAR_TAGS = ['food', 'grilled', 'local-cuisine', 'french-cuisine', 'shopping', 'culture', 'art', 'history', 'coffee', 'wifi', 'music', 'family', 'budget', 'luxury'];

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

export default function SearchDestinations({ onSelectDestinationForTrip, user }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (q.trim()) params.append('q', q.trim());
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    if (maxCost) params.append('max_cost', maxCost);

    try {
      const response = await fetch(`/destinations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch places');
      }

      setDestinations(data.data || []);
    } catch (err) {
      setError(err.message || 'Error connecting to service');
    } finally {
      setLoading(false);
    }
  }, [q, category, tag, maxCost]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDestinations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  const handleResetFilters = () => {
    setQ('');
    setCategory('');
    setTag('');
    setMaxCost('');
  };

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
      {/* Search & Filter Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={22} className="brand-icon" />
          <span>Explore Places in Yaounde</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Discover restaurants, markets, cafes, hotels, and cultural sites in Cameroon's capital city
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Keyword</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Search places, neighborhoods..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select
              className="select-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Interest Tag</label>
            <select
              className="select-control"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="">All Interests</option>
              {POPULAR_TAGS.map((t) => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Max Cost / Day (FCFA)</label>
            <input
              type="number"
              className="input-control"
              placeholder="e.g. 5000"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {(q || category || tag || maxCost) && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={handleResetFilters}>
              <RefreshCw size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Results Count & Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {loading ? 'Searching...' : `Showing ${destinations.length} place(s) in Yaounde`}
        </span>
      </div>

      {destinations.length === 0 && !loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MapPin size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No matching places found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Try adjusting your search query, category filter, or budget range.
          </p>
        </div>
      ) : (
        <div className="grid">
          {destinations.map((dest) => {
            const CatIcon = CATEGORY_ICONS[dest.category] || Building2;
            const catColor = CATEGORY_COLORS[dest.category] || 'var(--primary)';
            return (
              <div key={dest.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dest.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      <MapPin size={13} className="brand-icon" />
                      <span>{dest.address || dest.city}</span>
                    </div>
                  </div>

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
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {dest.tags.map((t) => (
                      <span key={t} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {user && onSelectDestinationForTrip && (
                  <button
                    className="btn btn-outline"
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
