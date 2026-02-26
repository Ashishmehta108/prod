/**
 * Script to find stock-in / stock-out records that may have been affected
 * by the UTC vs IST date bug (entries made between 12:00 AM – 5:30 AM IST).
 *
 * Run: npx ts-node scripts/check-date-bugs.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/rvl";

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db!;
    const collections = ["stockins", "stockouts"];

    let totalSuspicious = 0;

    for (const col of collections) {
        console.log(`━━━ Checking ${col.toUpperCase()} ━━━`);

        // Find records where createdAt is between 18:30 UTC and 23:59 UTC
        // (which is 12:00 AM – 5:30 AM IST — the danger window)
        const records = await db.collection(col).find({
            $expr: {
                $and: [
                    // createdAt hour is between 18 and 23 UTC (12:00 AM - 5:30 AM IST)
                    { $gte: [{ $hour: "$createdAt" }, 18] },
                    { $lte: [{ $hour: "$createdAt" }, 23] },
                ],
            },
        }).toArray();

        if (records.length === 0) {
            console.log("  ✅ No records created between 12:00 AM – 5:30 AM IST\n");
            continue;
        }

        console.log(`  Found ${records.length} record(s) created in 12 AM – 5:30 AM IST window:\n`);

        for (const r of records) {
            const dateField = new Date(r.date);
            const createdAt = new Date(r.createdAt);

            const dateDay = dateField.toISOString().split("T")[0];
            const createdDay = createdAt.toISOString().split("T")[0];

            // Convert createdAt to IST date
            const istCreated = new Date(createdAt.getTime() + 5.5 * 60 * 60 * 1000);
            const istDay = istCreated.toISOString().split("T")[0];

            const isMismatch = dateDay !== istDay;
            const isMidnight = dateField.getUTCHours() === 0 && dateField.getUTCMinutes() === 0;

            const status = isMismatch && isMidnight ? "🔴 LIKELY BUGGY" : "✅ OK";

            console.log(`  ${status}  _id: ${r._id}`);
            console.log(`         date field:  ${dateField.toISOString()} (${dateDay})`);
            console.log(`         createdAt:   ${createdAt.toISOString()} (IST: ${istDay})`);
            if (isMismatch && isMidnight) {
                console.log(`         ⚠️  Date says "${dateDay}" but IST date was "${istDay}"`);
                totalSuspicious++;
            }
            console.log();
        }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (totalSuspicious === 0) {
        console.log("✅ No buggy records found. Your data is clean!");
    } else {
        console.log(`🔴 Found ${totalSuspicious} potentially buggy record(s).`);
    }

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
