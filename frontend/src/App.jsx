import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import SearchDestinations from './components/SearchDestinations';
import Recommendations from './components/Recommendations';
import CreateItinerary from './components/CreateItinerary';
import ViewItineraries from './components/ViewItineraries';
import { MapPin, Sparkles } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gt_token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('gt_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('search');
  const [preselectedDestination, setPreselectedDestination] = useState(null);

  const handleLoginSuccess = (authData) => {
    const userPayload = {
      username: authData.username,
      user_id: authData.user_id,
      preferences: authData.preferences || []
    };
    setToken(authData.token);
    setUser(userPayload);
    localStorage.setItem('gt_token', authData.token);
    localStorage.setItem('gt_user', JSON.stringify(userPayload));
    setActiveTab('recommendations');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    setActiveTab('search');
  };

  const handleSelectDestinationForTrip = (dest) => {
    setPreselectedDestination(dest);
    setActiveTab('create-itinerary');
  };

  const handleItineraryCreated = () => {
    setPreselectedDestination(null);
    setActiveTab('itineraries');
  };

  return (
    <>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Hero Banner for Search & Welcome */}
      {activeTab === 'search' && (
        <header className="hero">
          <div className="container">
            <span className="badge badge-primary" style={{ marginBottom: '0.8rem' }}>
              <MapPin size={14} /> Yaounde Local Places Guide
            </span>
            <h1>Explore Yaounde</h1>
            <p>
              Discover the best restaurants, markets, cafes, hotels, and cultural sites in Cameroon's vibrant capital city.
            </p>
          </div>
        </header>
      )}

      <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {activeTab === 'search' && (
          <SearchDestinations
            user={user}
            onSelectDestinationForTrip={handleSelectDestinationForTrip}
          />
        )}

        {activeTab === 'recommendations' && user && (
          <Recommendations
            token={token}
            onSelectDestinationForTrip={handleSelectDestinationForTrip}
          />
        )}

        {activeTab === 'itineraries' && user && (
          <ViewItineraries
            token={token}
            onPlanNewTrip={() => setActiveTab('create-itinerary')}
          />
        )}

        {activeTab === 'create-itinerary' && user && (
          <CreateItinerary
            token={token}
            preselectedDestination={preselectedDestination}
            onItineraryCreated={handleItineraryCreated}
          />
        )}

        {activeTab === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            switchToRegister={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'register' && (
          <Register
            onRegisterSuccess={() => setActiveTab('login')}
            switchToLogin={() => setActiveTab('login')}
          />
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Yaounde Places Guide. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
