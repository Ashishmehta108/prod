import mongoose from "mongoose";
import { Product } from "../src/server/models/Product";
import {Unit} from "../src/server/models/Unit"

const MONGO_URI = "mongodb://localhost:27017/factory_inventory"; // <-- change this

async function seedUnits() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");


  const distinctUnits: string[] = await Product.distinct("unit", {
    unit: { $exists: true, $nin: [null, ""] },
  });

  console.log(`Found ${distinctUnits.length} distinct units:`, distinctUnits);

  if (distinctUnits.length === 0) {
    console.log("No units found in products. Exiting.");
    await mongoose.disconnect();
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const unitName of distinctUnits) {
    const trimmed = unitName.trim();
    if (!trimmed) { skipped++; continue; }

    const existing = await Unit.findOne({ name: trimmed });
    if (existing) {
      console.log(`  SKIP — already exists: "${trimmed}"`);
      skipped++;
      continue;
    }

    await Unit.create({ name: trimmed, isActive: true });
    console.log(`  CREATED: "${trimmed}"`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seedUnits().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});