import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: { userId: string; role: "superadmin" | "admin" | "user" };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "superadmin" | "admin" | "user";
    };

    console.log("rhis is auth", decoded)
    req.user = {
      userId: decoded.userId,
      role: decoded.role as "superadmin" | "admin" | "user"
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("adminOnly check:", req.user?.role)
  if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Admin or Superadmin only route" });
  }
  next();
};



export const superadminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log(req.user?.role)
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Superadmin only route" });
  }
  next();
};