import { generateTSPL, sendToPrinter } from "../modules/weight/print.service";

async function testPrint() {
    console.log("Starting Print Test...");

    // You can change the printer name here or pass it as an environment variable
    // The printer MUST be shared on your Windows machine with this exact name
    const printerName = process.env.PRINTER_NAME || "TSC TTP-244 Pro (Copy 1)";

    const dummyData = {
        productName: "TEST PRODUCT - LABELS",
        grossWeight: 10.55,
        tareWeight: 0.25,
        netWeight: 10.30,
        unit: "KG",
        rollNo: "ROLL-2024-TEST-001",
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };

    console.log(`Using Printer Name: ${printerName}`);
    console.log("Data to print:", dummyData);

    const tspl = generateTSPL(dummyData);

    try {
        console.log("Sending TSPL to printer...");
        const result = await sendToPrinter(tspl, printerName);
        if (result) {
            console.log("✅ Print job sent successfully!");
            console.log(`Hint: If nothing printed, ensure:
1. The printer is shared as '${printerName}'
2. You can access it via \\\\localhost\\${printerName} in Windows Explorer
3. The printer is powered on and connected.`);
        }
    } catch (error: any) {
        console.error("❌ Print Failed:", error.message);
    }
}

testPrint();
