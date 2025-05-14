const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the icons directory exists
const iconsDir = path.join(__dirname, 'build', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy the SVG to the build icons directory
fs.copyFileSync(
  path.join(__dirname, 'public', 'logo.svg'),
  path.join(iconsDir, 'icon.svg')
);

console.log('Converting SVG to ICO format for Windows...');

try {
  // Use electron-icon-maker to generate icons
  execSync('electron-icon-maker --input=public/logo.svg --output=build', {
    stdio: 'inherit'
  });
  console.log('Icon conversion completed successfully!');
} catch (error) {
  console.error('Error converting icon:', error.message);
}
