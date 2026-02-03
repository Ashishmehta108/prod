const fs = require('fs');

// Hex for a valid 1x1 transparent PNG
const hex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082';
const buf = Buffer.from(hex, 'hex');

fs.writeFileSync('build/icon.png', buf);
console.log('Created valid 1x1 PNG at build/icon.png');
