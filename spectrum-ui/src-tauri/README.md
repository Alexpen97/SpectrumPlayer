# Spectrum Player - Tauri Migration

This directory contains the Tauri configuration for the Spectrum Player application. Tauri provides a more efficient alternative to Electron, with smaller bundle sizes and better performance.

## Prerequisites

Before building the Tauri application, ensure you have the following installed:

1. **Rust and Cargo** - Install from [rustup.rs](https://rustup.rs/)
2. **Node.js and npm** - Required for the React frontend
3. **Tauri CLI** - Installed via npm in the project

## Building the Application

### Development Mode

To run the application in development mode:

```bash
npm run tauri:dev
```

This will start both the React development server and the Tauri application.

### Production Build

To build a production-ready executable:

```bash
npm run tauri:build
```

This will create a single executable file in the `src-tauri/target/release` directory.

## Distribution

The built application will be available in the following locations:

- Windows: `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/bundle/nsis/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/appimage/`

## Advantages Over Electron

- **Smaller bundle size**: Tauri apps are typically 10-20x smaller than Electron
- **Better performance**: Uses the system's native WebView instead of bundling Chromium
- **Single executable**: Packages everything into one file, solving distribution issues
- **Security**: More secure by default with a Rust backend

## Troubleshooting

If you encounter any issues:

1. Ensure Rust and all dependencies are properly installed
2. Check that the React application builds successfully on its own
3. Verify that the Tauri configuration in `tauri.conf.json` is correct
4. For Windows users, ensure you have the Microsoft Visual C++ Build Tools installed
