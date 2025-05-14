// Preload script for Electron
const { ipcRenderer } = require('electron');

// Expose window control functions directly to window object
// This is needed because we're using contextIsolation: false
process.once('loaded', () => {
  window.electronAPI = {
    minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
    maximizeWindow: () => ipcRenderer.send('window-control', 'maximize'),
    closeWindow: () => ipcRenderer.send('window-control', 'close')
  };
  
  console.log('Preload script loaded - window controls are available');
});
