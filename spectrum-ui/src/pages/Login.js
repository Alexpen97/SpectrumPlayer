import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, updateApiBaseUrl } from '../services/api';
import ApiConfigModal from '../components/ApiConfigModal';
import { isTauri } from '../services/tauri-bridge';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState(localStorage.getItem('apiBaseUrl') || 'http://localhost:8080');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [keySent, setKeySent] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  
  // Show a welcome message for Tauri users
  useEffect(() => {
    if (isTauri()) {
      setMessage('Welcome to Spectrum Player running in Tauri! Please configure your API connection if needed.');
    }
  }, []);
  
  // Generate a unique device ID if it doesn't exist
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      const deviceId = generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
    }
    
    // Pre-fill API key from localStorage if it exists
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setMessage('Your saved API key has been loaded. You can continue with device authentication.');
    }
  }, []);
  
  // Function to generate a unique device ID
  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Get device name (in Electron app this could be more specific)
  const getDeviceName = () => {
    return navigator.platform + ' - ' + navigator.userAgent.split(' ').slice(-3).join(' ');
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userData = await userService.login(username, password);
      
      if (userData) {
        // Store user data in local storage
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } catch (error) {
      setError(error.response?.data || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestApiKey = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await userService.requestApiKey(username, email);
      
      setMessage('API key has been sent to your email. Please check your inbox or server console.');
      setKeySent(true);
    } catch (error) {
      setError(error.response?.data || 'Failed to request API key.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeviceAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const deviceId = localStorage.getItem('deviceId');
      const deviceName = getDeviceName();
      
      const userData = await userService.authenticateDevice(
        username, password, apiKey, deviceId, deviceName
      );
      
      if (userData) {
        // Store user data in local storage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Store the API key for persistent authentication
        if (userData.apiKey) {
          localStorage.setItem('apiKey', userData.apiKey);
          console.log('API key saved for persistent authentication');
        } else {
          // Use the key from the input if not in response
          localStorage.setItem('apiKey', apiKey);
        }
        
        navigate('/');
      } else {
        setError('Authentication failed. Please check your credentials and API key.');
      }
    } catch (error) {
      setError(error.response?.data || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open API configuration modal
  const openApiConfig = () => {
    setShowApiConfig(true);
  };
  
  // Close API configuration modal
  const closeApiConfig = () => {
    setShowApiConfig(false);
    // Refresh the API base URL from localStorage
    setApiBaseUrl(localStorage.getItem('apiBaseUrl') || 'http://localhost:8080');
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>Spectrum</h1>
        </div>
        
        <div className="login-tabs">
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Quick Login
          </button>
          <button 
            className={`tab-button ${activeTab === 'api-key' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-key')}
          >
            Request API Key
          </button>
          <button 
            className={`tab-button ${activeTab === 'device-auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('device-auth')}
          >
            Device Authentication
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="login-info">
              <p>This login is for already authenticated devices.</p>
              <p>For a new device, request an API key first.</p>
            </div>
          </form>
        )}
        
        {activeTab === 'api-key' && (
          <form onSubmit={handleRequestApiKey} className="login-form">
            <div className="form-group">
              <label htmlFor="api-username">Username</label>
              <input
                type="text"
                id="api-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <button type="submit" className="login-button" disabled={loading || keySent}>
              {loading ? 'Requesting...' : keySent ? 'API Key Sent' : 'Request API Key'}
            </button>
            <div className="login-info">
              <p>An API key will be sent to your email.</p>
              <p>Once activated, the key won't expire and will be saved for future sessions.</p>
            </div>
          </form>
        )}
        
        {activeTab === 'device-auth' && (
          <form onSubmit={handleDeviceAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <input
                type="text"
                id="auth-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                type="password"
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="api-key">API Key</label>
              <input
                type="text"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Authenticating...' : 'Authenticate Device'}
            </button>
            <div className="login-info">
              <p>This will authenticate your device with the API key.</p>
              <p>Once authenticated, this device will remember your login.</p>
            </div>
          </form>
        )}
        
        {activeTab === 'settings' && (
          <div className="login-form">
            <div className="settings-section">
              <h3>API Configuration</h3>
              <p>Current API URL: {apiBaseUrl}</p>
              <button 
                type="button" 
                className="settings-button"
                onClick={openApiConfig}
              >
                Configure API Connection
              </button>
            </div>
            
            <div className="settings-section">
              <h3>Environment</h3>
              <p>Running in: {isTauri() ? 'Tauri' : 'Web Browser'}</p>
              {isTauri() && (
                <p className="info-note">
                  Note: When running in Tauri, you may need to use your computer's IP address 
                  instead of localhost to connect to your API server.
                </p>
              )}
            </div>
            
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            
            <div className="login-info">
              <p>Configure your Spectrum Player settings here.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* API Configuration Modal */}
      {showApiConfig && <ApiConfigModal onClose={closeApiConfig} />}
    </div>
  );
};

export default Login;
