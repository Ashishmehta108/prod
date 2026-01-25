
import { SerialPort } from 'serialport';

async function listPorts() {
    try {
        console.log('Scanning for serial ports...');
        const ports = await SerialPort.list();
        console.log(`count: ${ports.length}`);
        console.log(JSON.stringify(ports, null, 2));
    } catch (err) {
        console.error('Error listing ports:', err);
    }
}

listPorts();
