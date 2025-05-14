import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import pages
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import Artist from './pages/Artist';
import Album from './pages/Album';
import LikedSongsPage from './pages/LikedSongsPage';
import Login from './pages/Login';

// Import components
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import SearchBar from './components/SearchBar';
import TitleBar from './components/TitleBar';

// Import audio player context
import AudioPlayerProvider from './contexts/AudioPlayerContext';

// Import services
import { userService } from './services/api';

// Protected route component to handle authentication
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = userService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Check authentication on app start
  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        // First check if we have a stored API key to validate
        const apiKey = localStorage.getItem('apiKey');
        
        if (apiKey) {
          console.log('Found stored API key, attempting to validate...');
          const userData = await userService.validateStoredApiKey();
          
          if (userData) {
            console.log('API key is valid and activated');
            setIsAuthenticated(true);
            setIsInitialized(true);
            return;
          } else {
            console.log('API key validation failed');
          }
        }
        
        // Fall back to checking if already logged in
        const isLoggedIn = userService.isLoggedIn();
        
        if (isLoggedIn) {
          // Try to validate if the device is still authenticated
          const deviceId = localStorage.getItem('deviceId');
          if (deviceId) {
            try {
              // Use device validation as a fallback, but don't rely on it
              // If this fails, we'll still have the API key validation as primary auth method
              const response = await userService.validateDevice(deviceId);
              if (response && response.data && response.data.valid) {
                setIsAuthenticated(true);
              } else {
                // Device validation failed, but don't immediately logout
                // We'll let the API key validation be the main authentication method
                console.log('Device validation response:', response?.data || 'No valid response');
                // Only logout if we don't have a valid API key
                if (!localStorage.getItem('apiKey')) {
                  userService.logout();
                  setIsAuthenticated(false);
                }
              }
            } catch (error) {
              // Just log the error without forcing logout
              // This is expected if device authentication isn't set up yet
              console.log('Device validation unavailable, will rely on API key auth instead');
              
              // Only logout if we don't have a valid API key
              if (!localStorage.getItem('apiKey')) {
                userService.logout();
                setIsAuthenticated(false);
              }
            }
          } else {
            // No device ID, always redirect to login
            userService.logout();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Authentication check error:', error);
        setIsInitialized(true);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (!isInitialized) {
    // Show a loading spinner or message while checking authentication
    return <div className="loading-container">Loading...</div>;
  }
  
  return (
    <AudioPlayerProvider>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/*" element={
            isAuthenticated ? (
              <div className="app">
                <TitleBar />
                <div className="app-container" style={{ paddingTop: '32px' }}>
                  <Sidebar />
                  <div className="app-content">
                    <div className="top-bar">
                      <SearchBar />
                    </div>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="/collection/tracks" element={<LikedSongsPage />} />
                      <Route path="/playlist/:id" element={<PlaylistDetail />} />
                      <Route path="/artist/:name/:foreignId" element={<Artist />} />
                      <Route path="/artist/:artistId/album/:albumId" element={<Album />} />
                    </Routes>
                  </div>
                </div>
                <Player />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </Router>
    </AudioPlayerProvider>
  );
}

export default App;
