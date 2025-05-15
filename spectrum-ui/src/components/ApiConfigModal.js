import React, { useState, useEffect } from 'react';
import { updateApiBaseUrl } from '../services/api';
import '../styles/ApiConfigModal.css';

const ApiConfigModal = ({ onClose }) => {
  const [apiBaseUrl, setApiBaseUrl] = useState(localStorage.getItem('apiBaseUrl') || 'http://localhost:8080');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testStatus, setTestStatus] = useState(null);

  // Handle saving API configuration
  const handleSaveApiConfig = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      // Validate the URL format
      new URL(apiBaseUrl);
      
      // Update the API base URL
      updateApiBaseUrl(apiBaseUrl);
      setMessage(`API base URL saved: ${apiBaseUrl}`);
      
      // Test the connection
      testApiConnection();
    } catch (error) {
      setError('Please enter a valid URL (including http:// or https://)');
    }
  };

  // Test the API connection
  const testApiConnection = async () => {
    setTestStatus('testing');
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setError(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      setTestStatus('error');
      setError(`Cannot connect to API: ${error.message}`);
    }
  };

  return (
    <div className="api-config-modal-overlay">
      <div className="api-config-modal">
        <h2>API Configuration</h2>
        
        <form onSubmit={handleSaveApiConfig}>
          <div className="form-group">
            <label htmlFor="apiBaseUrl">API Base URL</label>
            <input
              type="text"
              id="apiBaseUrl"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              required
            />
          </div>
          
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          
          {testStatus === 'success' && (
            <div className="success-message">✓ Connection successful</div>
          )}
          {testStatus === 'error' && (
            <div className="error-message">✗ Connection failed</div>
          )}
          {testStatus === 'testing' && (
            <div className="info-message">Testing connection...</div>
          )}
          
          <div className="button-group">
            <button type="submit" className="save-button">
              Save & Test
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
        
        <div className="api-config-info">
          <p>Configure the API base URL to connect to your Spectrum API server.</p>
          <p>Default: http://localhost:8080</p>
          <p>For Tauri, you may need to use your computer's IP address instead of localhost.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;
