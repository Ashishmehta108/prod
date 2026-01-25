import { api } from "../client";
export type ApiRole = "superadmin" | "admin" | "user";

export interface ApiUser {
    _id: string;
    username: string;
    email: string;
    role: ApiRole;
}

export async function getUsersApi(): Promise<ApiUser[]> {
    const res = await api.get("/admin/auth/users");
    return res.data.users;
}

export async function createUserApi(payload: {
    username: string;
    email: string;
    password: string;
}) {
    const res = await api.post("/admin/auth/registerUser", payload);
    console.log("this is res")
    return res.data.user;
}

export async function updateUserApi(
    id: string,
    payload: {
        username?: string;
        email?: string;
        password?: string;
        role?: "admin" | "user";
    }
) {
    const res = await api.put(`/admin/auth/updateUser/${id}`, payload);
    return res.data.user;
}

export async function deleteUserApi(id: string) {
    await api.delete(`/admin/auth/deleteUser/${id}`);
}
