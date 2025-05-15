const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Determine if we're in dev or production
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev,
      devTools: true // Always enable DevTools for debugging
    },
    title: 'Spectrum',
    icon: path.join(__dirname, isDev ? 'public/icons/icon.png' : './icons/icon.png')
  });

  // Always open DevTools in both dev and production for debugging
  mainWindow.webContents.openDevTools();

  // Determine the correct path for loading the React app
  let indexPath;
  
  if (isDev) {
    // In development: load from React dev server
    indexPath = 'http://localhost:3000';
    console.log('Running in development mode');
  } else {
    // In production: load from the built files
    const indexHtmlPath = path.join(__dirname, './build/index.html');
    
    indexPath = url.format({
      pathname: indexHtmlPath,
      protocol: 'file:',
      slashes: true
    });
    
    console.log('Running in production mode');
    console.log('Loading from:', indexPath);
    console.log('__dirname is:', __dirname);
    
    // Debug: Check if the file exists
    if (fs.existsSync(indexHtmlPath)) {
      console.log('index.html file exists at this location');
      // Check the content of index.html
      const content = fs.readFileSync(indexHtmlPath, 'utf8');
      console.log('First 200 chars of index.html:', content.substring(0, 200));
    } else {
      console.error('index.html file does NOT exist at this location!');
    }
  }

  // Clear cache before loading
  session.defaultSession.clearCache().then(() => {
    // Load the React app
    mainWindow.loadURL(indexPath);
  });

  // Log console messages from the renderer process
  mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`Renderer Console [${level}]: ${message}`);
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  // Check if the file was successfully loaded
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription);
    console.log('Attempted URL:', validatedURL);
  });

  // Add event for successful page load
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully!');
    // Execute script to inspect page
    mainWindow.webContents.executeJavaScript(`
      console.log('Document title:', document.title);
      console.log('Body content exists:', !!document.body);
      console.log('Root element exists:', !!document.getElementById('root'));
      // Check for JavaScript errors
      window.onerror = function(message, source, lineno, colno, error) {
        console.error('JavaScript error:', message, 'at', source, lineno, colno);
        return false;
      };
    `);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
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