import fs from "fs";
import path from "path";
import { BSON } from "mongodb";

const BACKUP_DIR = path.join(process.cwd(), "factory_inventory - Copy");

async function checkDates(fileName: string) {
    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) return;

    const buffer = fs.readFileSync(filePath);
    let offset = 0;
    const dates: string[] = [];

    while (offset < buffer.length) {
        const size = buffer.readInt32LE(offset);
        if (offset + size > buffer.length) break;
        const doc = BSON.deserialize(buffer.subarray(offset, offset + size));
        if (doc.date) dates.push(new Date(doc.date).toISOString());
        offset += size;
    }

    console.log(`Dates in ${fileName}:`);
    console.log(dates.slice(0, 10).join("\n"));
    console.log("...");
    console.log(dates.slice(-10).join("\n"));
}

checkDates("stockins.bson");
