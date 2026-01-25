
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const PORT_PATH = 'COM3'; // Hardcoded based on previous findings
const BAUD_RATE = 9600;

console.log(`Attempting to read from ${PORT_PATH} at ${BAUD_RATE} baud...`);

const port = new SerialPort({
    path: PORT_PATH,
    baudRate: BAUD_RATE,
    autoOpen: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.open((err) => {
    if (err) {
        return console.log('Error opening port: ', err.message);
    }
    console.log('Port opened successfully. Waiting for data...');
});

// Open errors will be emitted as an error event
port.on('error', function (err) {
    console.log('Error: ', err.message);
});

// Switches the port into "flowing mode"
port.on('data', function (data) {
    console.log('Raw Data Buffer:', data);
    console.log('Raw Data String:', data.toString());
});

// Parser data (newlines)
parser.on('data', (data) => {
    console.log(`Parsed Line: ->${data}<-`);
});

// Close after 10 seconds
setTimeout(() => {
    console.log('Closing port after timeout...');
    port.close();
}, 10000);
