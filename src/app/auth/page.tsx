"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, signupAction } from "@/app/actions/auth";

type ViewMode = "login" | "signup" | "admin";

export default function AuthPage() {
  const [view, setView] = useState<ViewMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (view === "signup" && password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      if (view === "login" || view === "admin") {
        const res = await loginAction(username, password);
        if (res.success) {
          router.push(view === "admin" ? "/admin" : "/room");
        } else {
          setFormError(res.message || "Login failed");
        }
      } else {
        const res = await signupAction(username, password);
        if (res.success) {
          router.push("/room");
        } else {
          setFormError(res.message || "Signup failed");
        }
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (newView: ViewMode) => {
    setView(newView);
    setFormError("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="gate-container">
      {/* Background ambient glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#B5D2E6]/25 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-[#805232]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-[#B5D2E6]/20 rounded-full blur-[70px] pointer-events-none" />

      <section className="glass-auth-card">
        {/* Navigation & Header */}
        {view === "signup" || view === "admin" ? (
          <div className="w-full flex justify-start mb-4">
            <button 
              onClick={() => switchView("login")} 
              className="text-[#326080] hover:bg-[#326080]/5 p-2 -ml-2 rounded-full transition-colors"
              aria-label="Back to login"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="22" height="20" viewBox="0 0 24 24" fill="#805232">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h1 className="text-[18px] font-bold tracking-tight text-[#326080]">Cupid Match</h1>
            </div>
            <span className="text-[11px] font-mono tracking-widest text-[#8BAAB8] uppercase">Authentication</span>
          </div>
        )}

        {/* Dynamic Title */}
        <div className="flex flex-col items-center mb-6 w-full text-center">
          <h2 className="text-[20px] font-bold tracking-tight text-[#326080] mb-1">
            {view === "login" ? "Welcome Back" : view === "signup" ? "Create Account" : "Admin Portal"}
          </h2>
          <p className="text-[13px] text-[#5A7A90]">
            {view === "login" ? "Enter your credentials to continue" : view === "signup" ? "Create your private handle to connect" : "Administrative security checkpoint"}
          </p>
        </div>

        {formError && (
          <div className="w-full mb-4 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-[12.5px] text-center font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          {/* User ID / Admin ID */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11.5px] font-semibold text-[#326080]">
              {view === "admin" ? "Admin Identifier" : "Username / User ID"}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={view === "admin" ? "admin" : "Enter your ID"} 
                className="w-full h-[46px] pl-[38px] pr-4 bg-white/70 border border-[#326080]/10 focus:border-[#326080] focus:bg-white rounded-[14px] outline-none transition-all text-[14px] text-[#326080] placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11.5px] font-semibold text-[#326080]">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full h-[46px] pl-[38px] pr-10 bg-white/70 border border-[#326080]/10 focus:border-[#326080] focus:bg-white rounded-[14px] outline-none transition-all text-[14px] text-[#326080] placeholder:text-gray-400 font-medium"
              />
              <button 
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#326080] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password (Signup only) */}
          {view === "signup" && (
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[11.5px] font-semibold text-[#326080]">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full h-[46px] pl-[38px] pr-10 bg-white/70 border border-[#326080]/10 focus:border-[#326080] focus:bg-white rounded-[14px] outline-none transition-all text-[14px] text-[#326080] placeholder:text-gray-400 font-medium"
                />
                <button 
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#326080] transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-[48px] mt-2 bg-[#326080] text-white rounded-full font-semibold text-[14.5px] hover:bg-[#2A5270] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(50,96,128,0.2)]"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : view === "login" || view === "admin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="w-full flex items-center gap-3 my-5 opacity-25">
          <div className="h-[1px] flex-1 bg-black"></div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#805232"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <div className="h-[1px] flex-1 bg-black"></div>
        </div>

        {view === "login" && (
          <p className="text-[12.5px] font-medium text-[#5A7A90] mb-4">
            Don't have an account? <button onClick={() => switchView("signup")} className="text-[#326080] font-semibold underline underline-offset-2 ml-1">Sign up</button>
          </p>
        )}
        
        {view === "signup" && (
          <p className="text-[12.5px] font-medium text-[#5A7A90] mb-4">
            Already registered? <button onClick={() => switchView("login")} className="text-[#326080] font-semibold underline underline-offset-2 ml-1">Sign in</button>
          </p>
        )}

        {view !== "admin" && (
          <button 
            onClick={() => switchView("admin")}
            className="w-full h-[40px] border border-[#326080]/10 bg-white/40 hover:bg-white text-[#326080] rounded-full font-medium text-[12.5px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="3"/><path d="M7 16a5 5 0 0 1 10 0"/></svg>
            Administrator Console
          </button>
        )}
      </section>

      <p className="absolute bottom-6 text-[11px] text-[#8BAAB8] font-mono tracking-wider">
        © 2026 CUPID MATCH • ALL RIGHTS RESERVED
      </p>
    </div>
  );
}
