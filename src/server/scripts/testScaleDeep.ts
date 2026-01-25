
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const PORT_PATH = 'COM3';

async function testConnection(baudRate: number) {
    console.log(`\n--- Testing ${baudRate} Baud ---`);
    return new Promise<void>((resolve) => {
        const port = new SerialPort({
            path: PORT_PATH,
            baudRate: baudRate,
            autoOpen: false,
        });

        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        let receivedData = false;

        port.on('open', () => {
            console.log('Port Open. Listening...');

            // Try sending common "Get Weight" commands just in case
            setTimeout(() => { if (!receivedData) { console.log('Writing "W"...'); port.write('W\r\n'); } }, 2000);
            setTimeout(() => { if (!receivedData) { console.log('Writing "P"...'); port.write('P\r\n'); } }, 4000);
            setTimeout(() => { if (!receivedData) { console.log('Writing "R"...'); port.write('R\r\n'); } }, 6000);
        });

        port.on('data', (data) => {
            console.log(`[RAW]: ${data.toString('hex')} | ASCII: ${data.toString().trim()}`);
            receivedData = true;
        });

        parser.on('data', (data) => {
            console.log(`[PARSED]: ${data}`);
            receivedData = true;
        });

        port.on('error', (err) => {
            console.log('Port Error:', err.message);
            resolve();
        });

        port.open((err) => {
            if (err) { console.log("Open Error:", err.message); resolve(); }
        });

        // Close after 8 seconds
        setTimeout(() => {
            if (!receivedData) console.log("No data received.");
            if (port.isOpen) port.close();
            resolve();
        }, 8000);
    });
}

async function run() {
    await testConnection(9600);
    await testConnection(4800);
    console.log("\nDone.");
}

run();
