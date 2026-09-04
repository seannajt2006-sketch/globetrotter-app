import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, DollarSign, MapPin, Plus, Map as MapIcon } from 'lucide-react';
import MapComponent from './MapComponent';

export default function SearchDestinations({ user, onSelectDestinationForTrip }) {
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);

  const fetchDestinations = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (category) params.append('category', category);
      if (maxCost) params.append('max_cost', maxCost);

      const response = await fetch(`/destinations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load destinations');
      }

      setDestinations(data.data || []);
    } catch (err) {
      setError(err.message || 'Error connecting to Recommendation Service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDestinations();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Explore Yaoundé Places</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Find restaurants, markets, cafes, hotels, and cultural landmarks across the capital
          </p>
        </div>

        <button
          className={`btn ${showMap ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowMap(!showMap)}
        >
          <MapIcon size={18} />
          <span>{showMap ? 'Hide Map' : 'Show Interactive Map'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search-q">Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <input
                id="search-q"
                type="text"
                className="input-control"
                placeholder="e.g. Bastos, fish, museum..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              className="select-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="restaurant">Restaurants & Dining</option>
              <option value="market">Markets & Shopping</option>
              <option value="cafe">Cafes & Bakeries</option>
              <option value="accommodation">Hotels & Lodging</option>
              <option value="cultural">Cultural & Sightseeing</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="max-cost">Max Budget (XAF/day)</label>
            <input
              id="max-cost"
              type="number"
              className="input-control"
              placeholder="e.g. 20000"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Search size={18} />
              <span>Search Places</span>
            </button>
          </div>
        </div>
      </form>

      {/* Interactive Map View */}
      {showMap && (
        <MapComponent items={destinations} center={[3.8480, 11.5021]} zoom={13} />
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading places in Yaoundé...
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing {destinations.length} place(s)
          </div>

          <div className="grid">
            {destinations.map((dest) => (
              <div key={dest.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {dest.image_url && (
                  <div style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
                    <img src={dest.image_url} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dest.name}</h3>
                  <span className="badge badge-accent">
                    <Star size={12} fill="currentColor" /> {dest.rating || '4.0'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} /> {dest.address || 'Yaoundé'}
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>
                  {dest.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Daily Cost</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                      {dest.cost_per_day > 0 ? `${dest.cost_per_day.toLocaleString()} XAF` : 'Free'}
                    </div>
                  </div>

                  {user && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      onClick={() => onSelectDestinationForTrip(dest)}
                    >
                      <Plus size={16} />
                      <span>Add to Trip</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
