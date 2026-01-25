import { User } from "../../models/User";
import { Request, Response } from "express";

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Email, username, and password are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists"
      });
    }

    const user = await User.create({
      email,
      password,
      username,
      role: "user"
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message
    });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await User.find({ role: { $ne: "superadmin" } }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: users
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { email, password, role, username } = req.body;

    if (!email && !password && !role && !username) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update"
      });
    }

    const updateFields: any = {};
    if (email !== undefined) updateFields.email = email;
    if (username !== undefined) updateFields.username = username;
    if (password !== undefined && password !== "") updateFields.password = password;
    if (role !== undefined && role !== "") {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'admin' or 'user'"
        });
      }
      updateFields.role = role;
    }

    const user = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete superadmin user"
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
}
