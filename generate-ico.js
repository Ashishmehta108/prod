const fs = require('fs');
// Access the default export
const pngToIco = require('png-to-ico').default;

console.log('Generating icon.ico from icon.png...');

// pngToIco expects an array of files, or a single file string
pngToIco(['build/icon.png'])
    .then(buf => {
        fs.writeFileSync('build/icon.ico', buf);
        console.log(`Success! Created build/icon.ico (${buf.length} bytes)`);
    })
    .catch(err => {
        console.error('Error generating icon:', err);
        process.exit(1);
    });
