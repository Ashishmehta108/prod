import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Generate TSPL commands for TSC TTP-244 Pro
 * Label Size: 100mm x 150mm
 * 203 DPI
 */
export const generateTSPL = (data: {
    productName: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    unit: string;
    rollNo: string;
    date: string;
}) => {
    const { productName, grossWeight, tareWeight, netWeight, unit, rollNo, date } = data;

    return `SIZE 100 mm, 150 mm
GAP 3 mm, 0 mm
DIRECTION 1
REFERENCE 0,0
OFFSET 0 mm
SET PEEL OFF
SET CUTTER OFF
SET TEAR ON
CLS

TEXT 50,40,"3",0,1,1,"FACTORY ERP - WEIGHT LABEL"

QRCODE 50,90,M,6,A,0,"${rollNo}"

TEXT 220,100,"3",0,1,1,"Roll No:"
TEXT 220,130,"4",0,1,1,"${rollNo}"

TEXT 50,260,"3",0,1,1,"Product: ${productName.substring(0, 30)}"
TEXT 50,310,"3",0,1,1,"Gross: ${grossWeight.toFixed(2)} ${unit}"
TEXT 50,360,"3",0,1,1,"Tare:  ${tareWeight.toFixed(2)} ${unit}"
TEXT 50,410,"4",0,1,1,"NET:   ${netWeight.toFixed(2)} ${unit}"
TEXT 50,470,"2",0,1,1,"Date: ${date}"

PRINT 1,1
`;
};

/**
 * Send RAW TSPL to printer on Windows
 * Assumes the printer is shared or we use a tool like 'RawPrint' or 'copy'
 */
export const sendToPrinter = async (tspl: string, printerName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        try {
            const tempFile = path.join(os.tmpdir(), `label_${Date.now()}.tspl`);
            fs.writeFileSync(tempFile, tspl);

            // Windows command to send raw data to a shared printer
            // requires the printer to be shared. Example: net use LPT1 \\ComputerName\PrinterName
            // or using a third-party tool. Here we try the 'copy' command to a shared printer path.

            const command = `copy /B "${tempFile}" "\\\\localhost\\${printerName}"`;

            exec(command, (error, stdout, stderr) => {
                // We delete the temp file regardless
                try { fs.unlinkSync(tempFile); } catch (e) { }

                if (error) {
                    console.error(`Printer Error: ${error.message}`);
                    // In many dev environments, this command fails if no printer is there.
                    // For production, this would be accurately configured.
                    return reject(new Error("Failed to send data to printer. Check printer connection and sharing."));
                }
                resolve(true);
            });
        } catch (err: any) {
            reject(new Error(`Printing service error: ${err.message}`));
        }
    });
};
