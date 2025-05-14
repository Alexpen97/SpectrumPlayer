const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default frame
    titleBarStyle: 'hidden',
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: isDev, // Only allow Node.js integration in development
      contextIsolation: false, // Needed for IPC communication
      preload: path.join(__dirname, 'preload.js'), // Preload script for window controls
      webSecurity: !isDev, // Enable web security in production
    },
    title: 'Spectrum',
    icon: path.join(__dirname, '../build/icons/icon.png')
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  // Open Dev Tools (only in development)
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle window control events from renderer
ipcMain.on('window-control', (event, command) => {
  console.log('Received window control command:', command);
  switch(command) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});
