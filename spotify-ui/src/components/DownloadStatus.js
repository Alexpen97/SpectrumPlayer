import React, { useState, useEffect } from 'react';
import { albumService } from '../services/api';
import '../styles/DownloadStatus.css'; 
import { Spinner } from 'react-bootstrap';

// Simplified version with minimal React state management
const DownloadStatus = ({ albumId, artistId }) => {
  const [uiState, setUiState] = useState({
    showDownloadButton: false,
    loading: true,
    downloading: false,
    progress: 0,
    estimatedTime: null,
    errorMessage: null,
    statusText: null,
    message: null,
    messageType: null,
    isRequesting: false
  });
  
  // Direct API call function - completely bypasses React's state management
  const getDownloadStatus = () => {
    // Directly update DOM to show checking
    const statusEl = document.getElementById('download-status-container');
    const debugEl = document.getElementById('status-debug-info');
    
    if (debugEl) {
      debugEl.textContent = `Checking at ${new Date().toLocaleTimeString()}...`;
    }
    
    // Make the API call
    albumService.getAlbumDownloadStatus(parseInt(albumId))
      .then(response => {
        console.log('API Response:', response);
        
        if (response && response.data) {
          const data = response.data;
          
          // Update global cache
          window.latestStatus = data;
          
          // Direct DOM UI update for maximum reliability
          if (statusEl) {
            if (data.status === 'not_in_queue') {
              // Update React state to show download button
              setUiState(prev => ({
                ...prev,
                showDownloadButton: true,
                loading: false
              }));
            } else {
              // For downloading or completed, update the UI directly
              setUiState(prev => ({
                ...prev,
                showDownloadButton: false,
                loading: false,
                downloading: data.status === 'downloading',
                progress: data.progress || 0,
                estimatedTime: data.estimatedCompletionTime,
                errorMessage: data.errorMessage,
                statusText: data.status
              }));
              
              if (debugEl) {
                debugEl.innerHTML = `Status: ${data.status}<br>
                                     Progress: ${data.progress ? (data.progress ).toFixed(1) + '%' : 'N/A'}<br>
                                     Updated: ${new Date().toLocaleTimeString()}`;
              }
            }
          }
        } else {
          console.warn('Empty response data');
          setUiState(prev => ({
            ...prev,
            showDownloadButton: true,
            loading: false
          }));
          
          if (debugEl) {
            debugEl.textContent = `No data received at ${new Date().toLocaleTimeString()}`;
          }
        }
      })
      .catch(error => {
        console.error('API error:', error);
        setUiState(prev => ({
          ...prev,
          showDownloadButton: true,
          loading: false,
          errorMessage: 'Error checking status'
        }));
        
        if (debugEl) {
          debugEl.textContent = `Error at ${new Date().toLocaleTimeString()}: ${error.message}`;
        }
      });
  };
  
  // No manual import functionality needed

  // Function to request download
  const requestDownload = () => {
    setUiState(prev => ({
      ...prev,
      isRequesting: true,
      message: null
    }));
    
    albumService.requestAlbumDownload(parseInt(artistId), parseInt(albumId))
      .then(response => {
        setUiState(prev => ({
          ...prev,
          isRequesting: false,
          message: 'Download requested successfully!',
          messageType: 'success',
          loading: true
        }));
        
        // Check status after a delay
        setTimeout(getDownloadStatus, 2000);
      })
      .catch(error => {
        setUiState(prev => ({
          ...prev,
          isRequesting: false,
          message: 'Failed to request download',
          messageType: 'error'
        }));
      });
  };
  
  // Initial load - directly call API
  useEffect(() => {
    getDownloadStatus();
    
    // Set a fallback timer to show download button if nothing happens
    const fallbackTimer = setTimeout(() => {
      setUiState(prev => {
        if (prev.loading) {
          return {
            ...prev,
            loading: false,
            showDownloadButton: true
          };
        }
        return prev;
      });
    }, 5000);
    
    // Set interval for regular checks
    const checkInterval = setInterval(getDownloadStatus, 10000);
    
    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(checkInterval);
    };
  }, [albumId]); // Only re-run if albumId changes
  
  // Render based on UI state instead of React state
  return (
    <div className="download-section" id="download-status-container">
      {uiState.loading ? (
        <div className="loading-download-status">
          <p>Checking download status...</p>
          <button 
            onClick={getDownloadStatus} 
            style={{
              fontSize: '12px', 
              padding: '5px 12px', 
              marginTop: '10px',
              background: 'rgba(30, 215, 96, 0.2)', 
              border: '1px solid rgba(30, 215, 96, 0.4)', 
              color: 'white', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Check Now
          </button>
          <div id="status-debug-info" style={{fontSize: '10px', marginTop: '5px', color: 'rgba(255,255,255,0.7)'}}></div>
        </div>
      ) : uiState.showDownloadButton ? (
        <div>
          <button 
            className="download-button spotify-button" 
            onClick={requestDownload}
            disabled={uiState.isRequesting}
          >
            {uiState.isRequesting ? <><Spinner animation="border" size="sm" /> Requesting...</> : 'Download Album'}
          </button>
          
          <div style={{textAlign: 'center', marginTop: '10px'}}>
            <button 
              onClick={getDownloadStatus}
              className="check-status-button"
            >
              Check Status
            </button>
            <div id="status-debug-info" style={{fontSize: '10px', marginTop: '5px', color: 'rgba(255,255,255,0.7)'}}></div>
          </div>
        </div>
      ) : (
        <div className="download-status-container">
          <div className="download-status-header">
            <h3>Download Status</h3>
            <span className={`status-badge ${uiState.statusText}`}>
              {uiState.statusText === 'downloading' ? 'Downloading' : 
               uiState.statusText === 'completed' ? 'Completed' : 
               uiState.statusText}
            </span>
          </div>
          
          {(uiState.statusText === 'downloading' || uiState.statusText === 'completed') && 
           typeof uiState.progress === 'number' && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uiState.progress }%` }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round(uiState.progress )}%
              </span>
            </div>
          )}
          
          {uiState.estimatedTime && uiState.statusText === 'downloading' && (
            <div className="estimated-time">
              Est. completion: {new Date(uiState.estimatedTime).toLocaleTimeString()}
            </div>
          )}
          
          {uiState.errorMessage && (
            <div className="error-message">
              <p className="error-title">Error:</p>
              <p className="error-detail">{uiState.errorMessage}</p>
            </div>
          )}
          
          {uiState.statusText === 'completed' && (
            <div className="completed-actions">
              <div className="import-info">
                Download completed successfully.
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button 
              onClick={getDownloadStatus}
              className="check-status-button"
            >
              Refresh
            </button>
            <div id="status-debug-info" style={{fontSize: '10px', marginTop: '5px', color: 'rgba(255,255,255,0.7)'}}></div>
          </div>
        </div>
      )}
      
      {uiState.message && (
        <div className={`download-message ${uiState.messageType}`}>
          {uiState.message}
        </div>
      )}
      
      {/* No manual import modal needed */}
    </div>
  );
};

export default DownloadStatus;