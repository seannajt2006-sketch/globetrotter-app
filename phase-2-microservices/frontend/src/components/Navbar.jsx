import React, { useState } from 'react';
import { MapPin, Search, Sparkles, Map, PlusCircle, LogIn, LogOut, Menu, X, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="brand" onClick={() => handleNavClick('search')}>
          <MapPin className="brand-icon" size={28} />
          <span>Yaounde Places</span>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <button
              className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => handleNavClick('search')}
            >
              <Search size={18} />
              <span>Explore</span>
            </button>
          </li>

          {user && (
            <>
              <li>
                <button
                  className={`nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => handleNavClick('recommendations')}
                >
                  <Sparkles size={18} />
                  <span>For You</span>
                </button>
              </li>

              <li>
                <button
                  className={`nav-item ${activeTab === 'itineraries' ? 'active' : ''}`}
                  onClick={() => handleNavClick('itineraries')}
                >
                  <Map size={18} />
                  <span>My Trips</span>
                </button>
              </li>

              <li>
                <button
                  className={`nav-item ${activeTab === 'create-itinerary' ? 'active' : ''}`}
                  onClick={() => handleNavClick('create-itinerary')}
                >
                  <PlusCircle size={18} />
                  <span>Plan Visit</span>
                </button>
              </li>
            </>
          )}

          {user ? (
            <li>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <span className="badge badge-primary" style={{ textTransform: 'none', gap: '0.4rem' }}>
                  <User size={14} />
                  {user.username}
                </span>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={onLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </li>
          ) : (
            <>
              <li>
                <button
                  className={`nav-item ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => handleNavClick('login')}
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
              </li>
              <li>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', marginLeft: '0.5rem' }}
                  onClick={() => handleNavClick('register')}
                >
                  Sign Up
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
