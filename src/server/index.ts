import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import productRoutes from "./routes/products";
import stockInRoutes from "./routes/stockIn";
import stockOutRoutes from "./routes/stockOut";
import stockRoutes from "./routes/stock";
import dashboardRoutes from "./routes/dashboard";
import authRoutes from "./routes/auth";
import { adminAuthRoutes } from "./routes/admin/auth";
import qrcodeRoutes from "./routes/qrcode";
import weightRoutes from "./routes/weight";
import tallyRoutes from "./routes/tally";
import uploadRoutes from "./routes/upload";

import { createAdmin as createAdminScript } from "./scripts/createAdmin";

// Determine if we're in production (packaged app)
const isProduction = process.env.NODE_ENV === "production";
const RESOURCES_PATH = process.env.RESOURCES_PATH || process.cwd();

console.log("[Server] ========================================");
console.log("[Server] Starting Factory Inventory Server");
console.log("[Server] ========================================");
console.log(`[Server] Environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
console.log(`[Server] Resources Path: ${RESOURCES_PATH}`);
console.log(`[Server] Current Working Directory: ${process.cwd()}`);
console.log(`[Server] __dirname: ${__dirname}`);

// Load environment variables
function loadEnvFile() {
  if (isProduction) {
    // In production, .env is in extraResources
    const envPath = path.join(RESOURCES_PATH, ".env");
    console.log(`[Server] Loading .env from: ${envPath}`);

    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`[Server] .env file found and loaded`);
    } else {
      console.warn(`[Server] WARNING: .env file not found at ${envPath}`);
      dotenv.config(); // Try default location as fallback
    }
  } else {
    // In development, use default behavior
    dotenv.config();
    console.log(`[Server] Loaded .env from default location`);
  }

  // Log loaded status (without exposing values)
  console.log(`[Server] MONGO_URI present: ${!!process.env.MONGO_URI}`);
  console.log(`[Server] PORT: ${process.env.PORT || "using default 4000"}`);
}

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  console.error("[Server] ========================================");
  console.error("[Server] ERROR: MONGO_URI is not set in .env");
  console.error("[Server] ========================================");
  console.error(`[Server] Checked path: ${RESOURCES_PATH}`);
  console.error(`[Server] isProduction: ${isProduction}`);
  console.error(`[Server] Please ensure .env file exists with MONGO_URI`);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Setup upload directory
const uploadPath = isProduction
  ? path.join(RESOURCES_PATH, "upload", "images")
  : path.resolve(process.cwd(), "upload", "images");

console.log(`[Server] Upload directory path: ${uploadPath}`);

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  console.log("[Server] Upload directory does not exist, creating...");
  try {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("[Server] ✓ Upload directory created successfully");
  } catch (error) {
    console.error("[Server] ✗ Failed to create upload directory:", error);
    console.error("[Server] File uploads may not work properly");
  }
} else {
  console.log("[Server] ✓ Upload directory exists");

  // Check if directory is writable
  try {
    fs.accessSync(uploadPath, fs.constants.W_OK);
    console.log("[Server] ✓ Upload directory is writable");
  } catch (error) {
    console.error("[Server] ✗ Upload directory is not writable:", error);
    console.error("[Server] File uploads may fail");
  }
}

// Serve static files from the upload directory
app.use("/upload/images", express.static(uploadPath, {
  // Add error handling for static file serving
  setHeaders: (res, filePath) => {
    console.log(`[Server] Serving static file: ${filePath}`);
  }
}));

console.log("[Server] Static file serving configured for /upload/images");

// Create admin user
console.log("[Server] Initializing admin user...");
createAdminScript()
  .then(() => console.log("[Server] ✓ Admin user initialization complete"))
  .catch((err) => console.error("[Server] ✗ Admin user initialization failed:", err));

// Simple health check
app.get("/api/health", (_req, res) => {
  const uploadDirExists = fs.existsSync(uploadPath);
  const uploadDirWritable = uploadDirExists && (() => {
    try {
      fs.accessSync(uploadPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  })();

  res.json({
    status: "ok",
    environment: isProduction ? "production" : "development",
    uploadPath: uploadPath,
    uploadDirExists: uploadDirExists,
    uploadDirWritable: uploadDirWritable,
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Routes
console.log("[Server] Registering API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock-in", stockInRoutes);
app.use("/api/stock-out", stockOutRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/qrcode", qrcodeRoutes);
app.use("/api/tally", tallyRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/weight", weightRoutes);
console.log("[Server] ✓ API routes registered");

// 404 handler for undefined routes
app.use((req, res) => {
  console.warn(`[Server] 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: isProduction ? "An error occurred" : err.message
  });
});

// Connect DB and start server
console.log("[Server] Connecting to MongoDB...");
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[Server] ========================================");
    console.log("[Server] ✓ MongoDB connected successfully");
    console.log("[Server] ========================================");

    app.listen(PORT, () => {
      console.log("[Server] ========================================");
      console.log(`[Server] ✓ API listening on http://localhost:${PORT}`);
      console.log("[Server] ========================================");
      console.log("[Server] Available endpoints:");
      console.log(`[Server]   - GET  http://localhost:${PORT}/api/health`);
      console.log(`[Server]   - POST http://localhost:${PORT}/api/auth/...`);
      console.log(`[Server]   - *    http://localhost:${PORT}/api/products/...`);
      console.log(`[Server]   - *    http://localhost:${PORT}/api/upload/...`);
      console.log("[Server] ========================================");

      // Send ready message to parent process (Electron main)
      if (process.send) {
        process.send("server-ready");
        console.log("[Server] ✓ Sent ready message to Electron main process");
      }
    });
  })
  .catch((err) => {
    console.error("[Server] ========================================");
    console.error("[Server] ✗ MongoDB connection error:", err);
    console.error("[Server] ========================================");
    console.error("[Server] Please check:");
    console.error("[Server]   1. MONGO_URI is correct in .env");
    console.error("[Server]   2. MongoDB server is running");
    console.error("[Server]   3. Network connectivity to MongoDB");
    console.error("[Server] ========================================");
    process.exit(1);
  });

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("[Server] ========================================");
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  console.log("[Server] ========================================");

  mongoose.connection.close(false).then(() => {
    console.log("[Server] ✓ MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[Server] ========================================");
  console.log("[Server] SIGINT received, shutting down gracefully...");
  console.log("[Server] ========================================");

  mongoose.connection.close(false).then(() => {
    console.log("[Server] ✓ MongoDB connection closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("[Server] ========================================");
  console.error("[Server] UNCAUGHT EXCEPTION:", err);
  console.error("[Server] ========================================");
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] ========================================");
  console.error("[Server] UNHANDLED REJECTION at:", promise);
  console.error("[Server] Reason:", reason);
  console.error("[Server] ========================================");
});

console.log("[Server] Server initialization complete");