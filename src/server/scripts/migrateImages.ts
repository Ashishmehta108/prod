import "dotenv/config";
import path from "path";
import fs from "fs";

async function migrateImages() {
    const appName = "factory-inventory-desktop";

    // 1. Source directory (local project upload folder)
    const sourceDir = path.resolve(process.cwd(), "upload", "images");

    // 2. Destination directory (AppData folder)
    const destDir = path.join(
        process.env.APPDATA || (process.platform === 'darwin'
            ? path.join(process.env.HOME || '', 'Library/Preferences')
            : path.join(process.env.HOME || '', '.local/share')),
        appName,
        'upload',
        'images'
    );

    console.log("-----------------------------------------");
    console.log("IMAGE MIGRATION SCRIPT");
    console.log("-----------------------------------------");
    console.log(`Source:      ${sourceDir}`);
    console.log(`Destination: ${destDir}`);
    console.log("-----------------------------------------");

    if (!fs.existsSync(sourceDir)) {
        console.error(`ERROR: Source directory not found: ${sourceDir}`);
        process.exit(1);
    }

    // Ensure destination exists
    if (!fs.existsSync(destDir)) {
        console.log(`Creating destination directory...`);
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        const files = fs.readdirSync(sourceDir);
        console.log(`Found ${files.length} files in source directory.`);

        let copiedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const srcFile = path.join(sourceDir, file);
            const destFile = path.join(destDir, file);

            // Skip if it's a directory
            if (fs.lstatSync(srcFile).isDirectory()) continue;

            if (!fs.existsSync(destFile)) {
                fs.copyFileSync(srcFile, destFile);
                console.log(`[COPIED]  ${file}`);
                copiedCount++;
            } else {
                console.log(`[SKIPPED] ${file} (already exists)`);
                skippedCount++;
            }
        }

        console.log("\n-----------------------------------------");
        console.log("MIGRATION COMPLETE");
        console.log(`Total files found: ${files.length}`);
        console.log(`Files copied:      ${copiedCount}`);
        console.log(`Files skipped:     ${skippedCount}`);
        console.log("-----------------------------------------");
        console.log("You can now find your images at:");
        console.log(destDir);

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateImages();
