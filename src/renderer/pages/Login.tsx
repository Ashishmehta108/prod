import React, { useState } from "react";
import { api } from "../api/client";
import { LoginProps } from "@renderer/types/login.types";
import { toast } from "sonner";

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const authPromise =
      api.post("/auth/login", { role: "admin", email, password });

    toast.promise(authPromise, {
      loading: 'Signing in...',
      success: (response) => {
        localStorage.setItem("token", response.data.token);
        onLoginSuccess(response.data.user, response.data.token);
        return 'Welcome back!';
      },
      error: (err) => err.response?.data?.error || "Authentication failed"
    });

    try {
      await authPromise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-erp-bg px-4">
      <div className="w-full max-w-sm bg-erp-surface border border-erp-border rounded-lg">
        <div className="px-8 pt-10 pb-6 text-center">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Rvl Polytech
          </h1>
          <p className="mt-1 text-xs text-erp-text-secondary font-medium uppercase tracking-wider">
            Inventory Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@rvl.com"
              required
              className="h-10 w-full rounded border border-erp-border bg-erp-surface-muted px-3 text-sm text-neutral-900 placeholder:text-erp-text-secondary focus:bg-erp-surface focus:border-erp-accent focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded border border-erp-border bg-erp-surface-muted px-3 text-sm text-neutral-900 placeholder:text-erp-text-secondary focus:bg-erp-surface focus:border-erp-accent focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded bg-erp-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
