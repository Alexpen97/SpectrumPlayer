const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

// Path to the source PNG file
const sourcePng = path.join(__dirname, 'src-tauri', 'icons', 'icon.png');

// Path where the ICO file will be saved
const targetIco = path.join(__dirname, 'src-tauri', 'icons', 'icon.ico');

// Convert PNG to ICO
pngToIco([sourcePng])
  .then(buf => {
    // Write the buffer to the target file
    fs.writeFileSync(targetIco, buf);
    console.log(`Successfully created icon.ico from ${sourcePng}`);
  })
  .catch(err => {
    console.error('Error converting PNG to ICO:', err);
  });
