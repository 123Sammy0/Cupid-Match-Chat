"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error("Authentication failed. No user returned.");
      }

      // Check if the user is an admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-base text-text-main">
      <div className="w-full max-w-[400px] p-8 bg-surface border border-border-soft rounded-3xl shadow-[0_8px_40px_rgb(74,63,68,0.06)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent text-text-main rounded-full flex items-center justify-center mb-4 border border-border-soft shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Admin Portal</h1>
          <p className="text-sm text-text-sub mt-2">Restricted Access Only</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-sub uppercase tracking-wider ml-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-base border border-border-soft rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-alt focus:ring-2 focus:ring-accent-alt/50 transition-all text-text-main placeholder-text-sub/50"
              placeholder="admin@cupidmatch.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-sub uppercase tracking-wider ml-1">Passphrase</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-base border border-border-soft rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-alt focus:ring-2 focus:ring-accent-alt/50 transition-all text-text-main placeholder-text-sub/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-text-main font-bold rounded-xl py-3.5 mt-2 hover:bg-accent/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm border border-border-soft"
          >
            {isLoading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );
}
