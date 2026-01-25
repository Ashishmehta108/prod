const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../build/icon.png');
const outputPath = path.join(__dirname, '../build/icon.ico');

if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
}

const buffer = fs.readFileSync(inputPath);

pngToIco(buffer)
    .then(buf => {
        fs.writeFileSync(outputPath, buf);
        console.log('Icon created successfully at:', outputPath);
    })
    .catch(err => {
        console.error('Error creating icon:', err);
        process.exit(1);
    });
