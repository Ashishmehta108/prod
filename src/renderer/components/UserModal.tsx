import { X } from "lucide-react";
import { User } from "@renderer/pages/AdminPage"
import { useState, useEffect } from "react";

interface Props {
    user: User | null;
    onClose: () => void;
    onCreate: (payload: { username: string; email: string; password: string; role: "admin" | "user" | "superadmin" }) => void;
    onUpdate: (id: string, payload: { username?: string; email?: string; role?: "admin" | "user" | "superadmin" }) => void;
}

export function UserModal({ user, onClose, onCreate, onUpdate }: Props) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"admin" | "user">("user");

    useEffect(() => {
        if (user) {
            setUsername(user.name);
            setEmail(user.email);
            setRole(user.role.toLowerCase() as "admin" | "user");
        } else {
            setUsername("");
            setEmail("");
            setPassword("");
            setRole("user");
        }
    }, [user]);

    const handleSubmit = () => {
        if (user) {
            onUpdate(user.id, {
                username,
                email,
                role
            });
        } else {
            onCreate({
                username,
                email,
                password,
                role
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/10 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-neutral-900 text-lg font-semibold">
                        {user ? "Update User" : "Create User"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Full Name</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Full name"
                            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-200/60"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Email Address</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-200/60"
                        />
                    </div>
                    {!user && (
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-200/60"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Role</label>
                        <select
                            value={role.toUpperCase()}
                            onChange={(e) => setRole(e.target.value.toLowerCase() as "admin" | "user")}
                            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus:bg-white focus:outline-none"
                        >
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-700 transition-all duration-200 hover:bg-neutral-200/60"
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSubmit}
                        disabled={!username || !email || (!user && !password)}
                    >
                        {user ? "Save Changes" : "Create User"}
                    </button>
                </div>
            </div>
        </div>
    );
}
