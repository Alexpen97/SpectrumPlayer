import React, { useEffect } from 'react';
import '../styles/TitleBar.css';

const TitleBar = () => {
  // Check if window.electronAPI exists and log its availability
  useEffect(() => {
    console.log('Electron API available:', !!window.electronAPI);
    if (!window.electronAPI) {
      console.warn('Electron API not available - window controls will not work');
    }
  }, []);

  // Window control handlers
  const handleMinimize = () => {
    console.log('Minimize clicked');
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    } else {
      console.warn('Cannot minimize: Electron API not available');
    }
  };

  const handleMaximize = () => {
    console.log('Maximize clicked');
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    } else {
      console.warn('Cannot maximize: Electron API not available');
    }
  };

  const handleClose = () => {
    console.log('Close clicked');
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    } else {
      console.warn('Cannot close: Electron API not available');
    }
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="app-title">Spectrum</div>
      </div>
      <div className="window-controls">
        <button className="window-control minimize" onClick={handleMinimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect fill="currentColor" width="10" height="1" x="1" y="5.5" />
          </svg>
        </button>
        <button className="window-control maximize" onClick={handleMaximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect fill="currentColor" width="9" height="9" x="1.5" y="1.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="window-control close" onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M6.94 6l2.83-2.83a.67.67 0 0 0 0-.94.67.67 0 0 0-.94 0L6 5.06 3.17 2.23a.67.67 0 0 0-.94 0 .67.67 0 0 0 0 .94L5.06 6 2.23 8.83a.67.67 0 0 0 0 .94.67.67 0 0 0 .94 0L6 6.94l2.83 2.83a.67.67 0 0 0 .94 0 .67.67 0 0 0 0-.94L6.94 6z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
