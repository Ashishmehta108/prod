export const ROLE_PERMISSIONS = {
  admin: [
    "product:create",
    "product:read",
    "product:update",
    "product:delete",
    "stock:in",
    "stock:out",
    "dashboard:read",
    "users:manage",
  ],
  user: ["product:read", "stock:in", "stock:out", "dashboard:read"],
} as const;
