import "dotenv/config";
import { User } from "../models/User";

const ADMIN_EMAIL = "rvlpolytech@gmail.com";
const ADMIN_PASSWORD = "rvlpolytech";
const ADMIN_USERNAME = "rvlpolytech";

export async function createAdmin() {

    try {
        const existingUser = await User.findOne({
            $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }]
        });

        if (existingUser) {
            if (existingUser.role === "superadmin") {
                console.log("Admin user already exists:");
                console.log(`Email: ${existingUser.email}`);
                console.log(`Username: ${existingUser.username}`);
                console.log(`Role: ${existingUser.role}`);

                // Update password if needed
                existingUser.password = ADMIN_PASSWORD;
                await existingUser.save();
                console.log("Password has been updated.");
            } else {
                // Update existing user to admin
                existingUser.role = "admin";
                existingUser.password = ADMIN_PASSWORD;
                await existingUser.save();
                console.log("User updated to admin:");
                console.log(`Email: ${existingUser.email}`);
                console.log(`Username: ${existingUser.username}`);
                console.log(`Role: ${existingUser.role}`);
            }
        } else {
            // Create new admin user
            const adminUser = await User.create({
                username: ADMIN_USERNAME,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                role: "superadmin"
            });

            console.log("Admin user created successfully:");
            console.log(`Email: ${adminUser.email}`);
            console.log(`Username: ${adminUser.username}`);
            console.log(`Role: ${adminUser.role}`);
        }

    } catch (error: any) {
        console.error("Error creating admin user:", error.message);
    }
}

