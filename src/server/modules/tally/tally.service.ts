import axios from "axios";
import { TallyConfig } from "../../models/TallyConfig";
import { TallyVoucherData, TallySyncResult } from "./tally.types";

/**
 * Generates the Tally XML for a Stock Journal voucher
 */
export const generateVoucherXML = (
    data: TallyVoucherData,
    config: any
): string => {
    const { companyName, defaultGodown, sourceGodown } = config;

    if (!data.date) {
        throw new Error("Voucher date is required for Stock Journal");
    }

    // Tally date format: YYYYMMDD
    const formatTallyDate = (date: string) => {
        const d = new Date(date);
        // Use 1st of month for Educational Mode
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}01`;
    };

    const tallyDate = formatTallyDate(data.date);
    const safeQty = data.quantity > 0 ? data.quantity : 1;
    const fromGodown = sourceGodown || defaultGodown || "Main Location";
    const toGodown = defaultGodown || "Main Location";

    return `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Import Data</TALLYREQUEST>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>Vouchers</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
<TALLYMESSAGE xmlns:UDF="TallyUDF">
<VOUCHER VCHTYPE="Stock Journal" ACTION="Create">
<DATE>${tallyDate}</DATE>
<VOUCHERTYPENAME>Stock Journal</VOUCHERTYPENAME>
<VOUCHERNUMBER>${data.rollNo}</VOUCHERNUMBER>
<NARRATION>${data.narration || ""}</NARRATION>
<INVENTORYENTRIESIN.LIST>
<STOCKITEMNAME>${data.itemName}</STOCKITEMNAME>
<ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
<ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
<ACTUALQTY>${safeQty} ${data.unit}</ACTUALQTY>
<BILLEDQTY>${safeQty} ${data.unit}</BILLEDQTY>
<BATCHALLOCATIONS.LIST>
<GODOWNNAME>${toGodown}</GODOWNNAME>
<ACTUALQTY>${safeQty} ${data.unit}</ACTUALQTY>
<BILLEDQTY>${safeQty} ${data.unit}</BILLEDQTY>
</BATCHALLOCATIONS.LIST>
</INVENTORYENTRIESIN.LIST>
<INVENTORYENTRIESOUT.LIST>
<STOCKITEMNAME>${data.itemName}</STOCKITEMNAME>
<ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
<ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
<ACTUALQTY>${safeQty} ${data.unit}</ACTUALQTY>
<BILLEDQTY>${safeQty} ${data.unit}</BILLEDQTY>
<BATCHALLOCATIONS.LIST>
<GODOWNNAME>${fromGodown}</GODOWNNAME>
<ACTUALQTY>${safeQty} ${data.unit}</ACTUALQTY>
<BILLEDQTY>${safeQty} ${data.unit}</BILLEDQTY>
</BATCHALLOCATIONS.LIST>
</INVENTORYENTRIESOUT.LIST>
</VOUCHER>
</TALLYMESSAGE>
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</ENVELOPE>`;
};

/**
 * Sends XML to Tally Agent
 */
export const sendToTallyAgent = async (xml: string, config: any): Promise<TallySyncResult> => {
    const { tallyIp, tallyPort } = config;
    const url = `http://${tallyIp}:${tallyPort}`;

    try {
        const response = await axios.post(url, xml, {
            headers: { "Content-Type": "text/xml" },
            timeout: 5000,
        });

        const responseStr = response.data;

        // Simple basic XML parsing to check for errors in Tally response
        if (responseStr.includes("<LINEERROR>") || responseStr.includes("<ERRORS>1</ERRORS>")) {
            // Extract the error message if possible
            const errorMatch = responseStr.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
            const specificError = errorMatch ? errorMatch[1] : "Tally returned an unknown error during import";

            return {
                success: false,
                message: specificError,
                xmlSent: xml,
                responseRaw: responseStr
            };
        }

        return {
            success: true,
            message: "Sync Successful",
            responseRaw: responseStr
        };
    } catch (error: any) {
        console.error("Tally Agent unreachable:", error.message);
        return {
            success: false,
            message: `Tally Agent Connection Failed: ${error.message}`,
            xmlSent: xml
        };
    }
};

/**
 * Tests connection to Tally Agent
 */
export const testConnection = async (config: any): Promise<boolean> => {
    const { tallyIp, tallyPort } = config;
    const url = `http://${tallyIp}:${tallyPort}`;
    try {
        // Tally responds to a simple GET or empty POST usually
        await axios.get(url, { timeout: 2000 });
        return true;
    } catch (err: any) {
        // Even if it's 405 or 400, it means it's reachable. Only if it's timeout or refuse, it's dead.
        return err.response ? true : false;
    }
}

/**
 * Generates XML to create a Stock Item in Tally
 */
export const generateStockItemXML = (
    itemName: string,
    unit: string,
    config: any
): string => {
    const { companyName } = config;

    return `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Import Data</TALLYREQUEST>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>All Masters</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
<TALLYMESSAGE xmlns:UDF="TallyUDF">
<STOCKITEM NAME="${itemName}" ACTION="Create">
<NAME>${itemName}</NAME>
<PARENT/>
<UNITS>${unit}</UNITS>
<GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
<ISGSTGOODS>Yes</ISGSTGOODS>
</STOCKITEM>
</TALLYMESSAGE>
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</ENVELOPE>`;
};

/**
 * Creates a stock item in Tally
 */
export const createStockItemInTally = async (
    itemName: string,
    unit: string,
    config: any
): Promise<TallySyncResult> => {
    const xml = generateStockItemXML(itemName, unit, config);
    return sendToTallyAgent(xml, config);
};

/**
 * Generates XML to create a Godown in Tally
 */
export const generateGodownXML = (
    godownName: string,
    config: any
): string => {
    const { companyName } = config;

    return `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Import Data</TALLYREQUEST>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>All Masters</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
<TALLYMESSAGE xmlns:UDF="TallyUDF">
<GODOWN NAME="${godownName}" ACTION="Create">
<NAME>${godownName}</NAME>
<PARENT></PARENT>
</GODOWN>
</TALLYMESSAGE>
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</ENVELOPE>`;
};

/**
 * Creates a godown in Tally
 */
export const createGodownInTally = async (
    godownName: string,
    config: any
): Promise<TallySyncResult> => {
    const xml = generateGodownXML(godownName, config);
    return sendToTallyAgent(xml, config);
};

/**
 * Generates XML to create a Unit in Tally
 */
export const generateUnitXML = (
    symbol: string,
    formalName: string,
    config: any
): string => {
    const { companyName } = config;

    return `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Import Data</TALLYREQUEST>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>All Masters</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>
<TALLYMESSAGE xmlns:UDF="TallyUDF">
<UNIT NAME="${symbol}" ACTION="Create">
<NAME>${symbol}</NAME>
<ISSYMBOLONLY>No</ISSYMBOLONLY>
<FORMALNAME>${formalName}</FORMALNAME>
<DECIMALPLACES>3</DECIMALPLACES>
</UNIT>
</TALLYMESSAGE>
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</ENVELOPE>`;
};

/**
 * Creates a unit in Tally
 */
export const createUnitInTally = async (
    symbol: string,
    formalName: string,
    config: any
): Promise<TallySyncResult> => {
    const xml = generateUnitXML(symbol, formalName, config);
    return sendToTallyAgent(xml, config);
};
