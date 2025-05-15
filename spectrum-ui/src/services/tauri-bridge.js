/**
 * Tauri Bridge - Provides a compatibility layer between Electron and Tauri
 * 
 * This module detects whether the app is running in Tauri or Electron
 * and provides appropriate implementations of platform-specific features.
 */

// We'll use the global Tauri object instead of imports to avoid build issues
// These functions will be available when running in Tauri environment

// Check if we're running in Tauri
export const isTauri = () => {
  return window.__TAURI__ !== undefined;
};

// Check if we're running in Electron
export const isElectron = () => {
  return window.electron !== undefined;
};

// Window control functions
export const windowControls = {
  minimize: async () => {
    if (isTauri()) {
      try {
        // Use the Tauri command to minimize the window
        await window.__TAURI__.invoke('window_control', { command: 'minimize' });
      } catch (error) {
        console.error('Error minimizing window:', error);
      }
    } else if (isElectron()) {
      window.electron.send('window-control', 'minimize');
    }
  },
  
  maximize: async () => {
    if (isTauri()) {
      try {
        // Use the Tauri command to maximize/restore the window
        await window.__TAURI__.invoke('window_control', { command: 'maximize' });
      } catch (error) {
        console.error('Error maximizing window:', error);
      }
    } else if (isElectron()) {
      window.electron.send('window-control', 'maximize');
    }
  },
  
  close: async () => {
    if (isTauri()) {
      try {
        // Use the Tauri command to close the window
        await window.__TAURI__.invoke('window_control', { command: 'close' });
      } catch (error) {
        console.error('Error closing window:', error);
      }
    } else if (isElectron()) {
      window.electron.send('window-control', 'close');
    }
  }
};

// Local storage wrapper to ensure compatibility
export const storage = {
  getItem: async (key) => {
    if (isTauri()) {
      // Just use browser localStorage for now
      return localStorage.getItem(key);
    } else {
      // Use browser localStorage
      return localStorage.getItem(key);
    }
  },
  
  setItem: async (key, value) => {
    if (isTauri()) {
      // Just use browser localStorage for now
      localStorage.setItem(key, value);
    } else {
      // Use browser localStorage
      localStorage.setItem(key, value);
    }
  },
  
  removeItem: async (key) => {
    if (isTauri()) {
      // Just use browser localStorage for now
      localStorage.removeItem(key);
    } else {
      // Use browser localStorage
      localStorage.removeItem(key);
    }
  }
};

// File system operations
export const fileSystem = {
  checkFileExists: async (path) => {
    if (isTauri()) {
      if (window.__TAURI__?.fs) {
        try {
          return await window.__TAURI__.fs.exists(path);
        } catch (e) {
          console.error('Error checking if file exists:', e);
          return false;
        }
      }
      return false;
    } else if (isElectron()) {
      // In Electron, we would use Node.js fs module via IPC
      console.warn('File system operations not implemented for Electron in this bridge');
      return false;
    }
    return false;
  },
  
  createDirectory: async (path) => {
    if (isTauri()) {
      if (window.__TAURI__?.fs) {
        try {
          await window.__TAURI__.fs.createDir(path, { recursive: true });
        } catch (e) {
          console.error('Error creating directory:', e);
        }
      }
    } else if (isElectron()) {
      // In Electron, we would use Node.js fs module via IPC
      console.warn('File system operations not implemented for Electron in this bridge');
    }
  }
};

// Open external links
export const openExternal = async (url) => {
  if (isTauri()) {
    if (window.__TAURI__?.shell) {
      await window.__TAURI__.shell.open(url);
    } else {
      window.open(url, '_blank');
    }
  } else if (isElectron()) {
    // In Electron, we would use shell.openExternal
    window.open(url, '_blank');
  } else {
    window.open(url, '_blank');
  }
};

// Get app version
export const getAppVersion = async () => {
  if (isTauri()) {
    if (window.__TAURI__?.app) {
      try {
        return await window.__TAURI__.app.getVersion();
      } catch (e) {
        console.error('Error getting app version:', e);
        return 'Unknown (Tauri)'; 
      }
    }
    return 'Unknown (Tauri)';
  } else if (isElectron()) {
    // In Electron, we would get this from the main process
    return 'Unknown (Electron)';
  }
  return 'Unknown';
};

// Export a unified API
export default {
  isTauri,
  isElectron,
  windowControls,
  storage,
  fileSystem,
  openExternal,
  getAppVersion
};
