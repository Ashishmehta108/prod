import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const rbac = (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthRequest;
    if (!user?.role || user.role !== "superadmin" && user.role != "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};
