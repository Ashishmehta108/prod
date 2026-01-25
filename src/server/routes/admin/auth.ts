import { Router } from "express";
import { deleteUser, getUsers, registerUser, updateUser } from "../../controller/admin/auth.controller";
import { auth, superadminOnly } from "../../middleware/auth";
export const adminAuthRoutes = Router();

adminAuthRoutes.post("/registerUser", auth, superadminOnly, registerUser);

adminAuthRoutes.get("/users", auth, superadminOnly, getUsers);

adminAuthRoutes.put("/updateUser/:id", auth, superadminOnly, updateUser);

adminAuthRoutes.delete("/deleteUser/:id", auth, superadminOnly, deleteUser);
