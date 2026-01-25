"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { UserModal } from "@renderer/components/UserModal";
import { DeleteModal } from "@renderer/components/DeleteModal";
import { getUsersApi, createUserApi, deleteUserApi, updateUserApi } from "@renderer/api/admin/adminApi";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeleton";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "user";
  active: boolean;
}

const mapApiUser = (u: any): User => {
  console.log("Mapping user data:", u);
  return {
    id: u.id || u._id,
    name: u.username || u.name || "Unknown",
    email: u.email || "",
    role: (u.role || "user").toLowerCase() as "superadmin" | "admin" | "user",
    active: true,
  };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openDelete, setOpenDelete] = useState<User | null>(null);

  // Fetch users
  useEffect(() => {
    (async () => {
      try {
        const data = await getUsersApi();
        setUsers(data.map(mapApiUser));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (payload: {
    username: string;
    email: string;
    password: string;
  }) => {
    const createPromise = createUserApi(payload);

    toast.promise(createPromise, {
      loading: 'Creating user...',
      success: (newUser) => {
        setUsers((prev) => [...prev, mapApiUser(newUser)]);
        setOpenUserModal(false);
        return 'User created successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to create user',
    });

    try { await createPromise; } catch (e) { }
  };

  const handleUpdate = async (
    id: string,
    payload: {
      username?: string;
      email?: string;
      password?: string;
      role?: "admin" | "user";
    }
  ) => {
    const updatePromise = updateUserApi(id, payload as any);

    toast.promise(updatePromise, {
      loading: 'Updating user...',
      success: (updated) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? mapApiUser(updated) : u))
        );
        setOpenUserModal(false);
        return 'User updated successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to update user',
    });

    try { await updatePromise; } catch (e) { }
  };

  const handleDelete = async (id: string) => {
    const deletePromise = deleteUserApi(id);

    toast.promise(deletePromise, {
      loading: 'Deleting user...',
      success: () => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setOpenDelete(null);
        return 'User deleted successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to delete user',
    });

    try { await deletePromise; } catch (e) { }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-neutral-900 text-xl font-semibold">Users</h1>
          <p className="text-neutral-500 text-sm">
            Manage system users and roles
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setOpenUserModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-neutral-800 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm font-sans">
        {loading ? (
          <div className="p-6">
            <TableSkeleton cols={5} rows={6} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50">
              <tr className="text-neutral-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-5 py-4 text-left">Name</th>
                <th className="px-5 py-4 text-left">Email</th>
                <th className="px-5 py-4 text-left">Role</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="group border-b border-neutral-100 transition hover:bg-neutral-50/50"
                >
                  <td className="px-5 py-4 font-medium text-neutral-900">{user.name}</td>
                  <td className="px-5 py-4 text-neutral-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className="capitalize px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-emerald-600 font-medium tracking-tight">Active</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setOpenUserModal(true);
                        }}
                        className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 rounded-lg text-neutral-400 hover:text-blue-600 transition-all"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setOpenDelete(user)}
                        className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 rounded-lg text-neutral-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {openUserModal && (
        <UserModal
          user={selectedUser}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={() => setOpenUserModal(false)}
        />
      )}

      {openDelete && (
        <DeleteModal
          user={openDelete}
          onConfirm={() => handleDelete(openDelete.id)}
          onClose={() => setOpenDelete(null)}
        />
      )}
    </div>
  );
}
