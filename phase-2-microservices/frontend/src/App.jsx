import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import SearchDestinations from './components/SearchDestinations';
import Recommendations from './components/Recommendations';
import CreateItinerary from './components/CreateItinerary';
import ViewItineraries from './components/ViewItineraries';
import DestinationDetail from './components/DestinationDetail';
import CommunityChat from './components/CommunityChat';
import MapExplorer from './components/MapExplorer';
import { MapPin } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gt_token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('gt_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('search');
  const [preselectedDestination, setPreselectedDestination] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [previousTab, setPreviousTab] = useState('search');
  const [mapFocusDestination, setMapFocusDestination] = useState(null);

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

  const handleAuthFailure = () => {
    handleLogout();
    setActiveTab('login');
  };

  const handleSelectDestinationForTrip = (dest) => {
    setPreselectedDestination(dest);
    setActiveTab('create-itinerary');
  };

  const handleViewDestination = (dest) => {
    setSelectedDestination(dest);
    setPreviousTab(activeTab);
    setActiveTab('destination-detail');
  };

  const handleGetDirections = (dest) => {
    setMapFocusDestination(dest);
    setActiveTab('map');
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

      {activeTab === 'search' && (
        <header className="hero">
          <div className="container">
            <span className="badge badge-primary" style={{ marginBottom: '0.8rem' }}>
              <MapPin size={14} /> Yaoundé Microservices Travel Platform
            </span>
            <h1>GlobeTrotter — Yaoundé Guide</h1>
            <p>
              Discover restaurants, markets, cafes, hotels, and cultural sites in Cameroon's capital city with interactive map navigation.
            </p>
          </div>
        </header>
      )}

      <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {activeTab === 'search' && (
          <SearchDestinations
            user={user}
            onSelectDestinationForTrip={handleSelectDestinationForTrip}
            onViewDestination={handleViewDestination}
            onGetDirections={handleGetDirections}
          />
        )}

        {activeTab === 'recommendations' && user && (
          <Recommendations
            token={token}
            onAuthFailure={handleAuthFailure}
            onSelectDestinationForTrip={handleSelectDestinationForTrip}
            onViewDestination={handleViewDestination}
            onGetDirections={handleGetDirections}
          />
        )}

        {activeTab === 'destination-detail' && selectedDestination && (
          <DestinationDetail
            destination={selectedDestination}
            token={token}
            user={user}
            onBack={() => setActiveTab(previousTab)}
            onGetDirections={handleGetDirections}
          />
        )}

        {activeTab === 'chat' && user && (
          <CommunityChat token={token} user={user} />
        )}

        {activeTab === 'map' && (
          <MapExplorer focusDestination={mapFocusDestination} />
        )}

        {activeTab === 'itineraries' && user && (
          <ViewItineraries
            token={token}
            onAuthFailure={handleAuthFailure}
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
          <p>&copy; {new Date().getFullYear()} GlobeTrotter Phase 2 Microservices Architecture. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
