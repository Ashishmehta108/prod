
import { listPorts } from '../modules/weight/weight.service';

async function test() {
    console.log("Testing listPorts() logic...");
    try {
        const ports = await listPorts();
        console.log("Result:", JSON.stringify(ports, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
