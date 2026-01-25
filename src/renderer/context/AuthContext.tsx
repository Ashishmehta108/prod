import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../api/client";

interface User {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem("token");
    console.log("AuthProvider: Checking for stored token...", storedToken ? "Token found" : "No token");

    if (storedToken) {
      setToken(storedToken);
      // We don't need to manually set the header here because the axios interceptor
      // in client.ts will pick it up from localStorage for the next request.

      // Verify token and get user info
      console.log("AuthProvider: Verifying token via /auth/me...");
      api
        .get("/auth/me")
        .then((response) => {
          console.log("AuthProvider: Token verified successfully:", response.data.user);
          setUser(response.data.user);
        })
        .catch((error) => {
          console.error("AuthProvider: Token verification failed:", error.response?.data || error.message);
          // Only remove token if it's explicitly unauthorized (401)
          // If it's a network error or 500, we keep the token and let the user retry
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            setToken(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    console.log("AuthProvider: Logging in user...", userData.email);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    console.log("AuthProvider: Logging out...");
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

