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
        // Assume admin login uses same loginAction but checks roles later (or redirect goes to room -> admin redirect)
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
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#fafafa] text-[#111] font-sans px-4 py-8 relative overflow-hidden">
      
      {/* Subtle background blurs */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gray-200/40 rounded-full blur-[40px] pointer-events-none"></div>
      <div className="absolute top-20 right-10 w-24 h-24 bg-gray-200/40 rounded-full blur-[30px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-gray-200/40 rounded-full blur-[50px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-gray-200/40 rounded-full blur-[60px] pointer-events-none"></div>

      <section className="relative w-full max-w-[380px] bg-white rounded-[24px] shadow-[0_4px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex flex-col items-center">
        
        {/* Header Section */}
        {view === "signup" || view === "admin" ? (
          <div className="w-full flex justify-start mb-6">
            <button 
              onClick={() => switchView("login")} 
              className="text-[#111] hover:bg-gray-100 p-2 -ml-2 rounded-full transition-colors"
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="22" height="20" viewBox="0 0 24 24" fill="#111" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h1 className="text-[17px] font-bold tracking-tight">Cupid Match</h1>
            </div>
          </div>
        )}

        {/* Dynamic Title / Icon Area */}
        <div className="flex flex-col items-center mb-8 w-full text-center">
          {view === "signup" && (
            <div className="relative mb-4">
              <svg className="absolute -top-2 -left-2 text-gray-300 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7"/></svg>
              <svg className="absolute top-0 -right-4 text-gray-200 w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M22 12H2"/></svg>
              <div className="relative">
                <svg width="64" height="60" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <div className="absolute -bottom-2 -right-2 bg-[#111] text-white rounded-full p-1 border-[3px] border-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </div>
            </div>
          )}
          {view === "admin" && (
            <div className="relative mb-4">
              <svg className="absolute -top-1 -right-2 text-gray-300 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7"/></svg>
              <svg className="absolute top-4 -left-4 text-gray-200 w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M22 12H2"/></svg>
              <svg width="60" height="64" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="10" r="3" />
                <path d="M7 16a5 5 0 0 1 10 0" />
              </svg>
            </div>
          )}
          
          <h2 className="text-[22px] font-bold mb-1.5">
            {view === "login" ? "Welcome back!" : view === "signup" ? "Create Account" : "Admin Login"}
          </h2>
          <p className="text-[12px] text-gray-500 font-medium">
            {view === "login" ? "Login to continue your journey" : view === "signup" ? "Start your journey with Cupid Match" : "Secure access for administrators"}
          </p>
        </div>

        {formError && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-100 text-[#D97A89] rounded-xl text-[13px] text-center font-medium animate-in fade-in">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          {/* User ID / Admin ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#111]">{view === "admin" ? "Admin ID" : "User ID"}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={view === "admin" ? "Enter admin ID" : view === "signup" ? "Choose a user ID" : "Enter your user ID"} 
                className="w-full h-[46px] pl-[44px] pr-4 bg-transparent border-[1.5px] border-gray-200 focus:border-[#111] focus:ring-0 rounded-[14px] outline-none transition-colors text-[14px] text-[#111] placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Email (Signup only) */}
          {view === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#111]">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="w-full h-[46px] pl-[44px] pr-4 bg-transparent border-[1.5px] border-gray-200 focus:border-[#111] focus:ring-0 rounded-[14px] outline-none transition-colors text-[14px] text-[#111] placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[11px] font-bold text-[#111]">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={view === "signup" ? "Create a password" : "Enter your password"} 
                className="w-full h-[46px] pl-[44px] pr-10 bg-transparent border-[1.5px] border-gray-200 focus:border-[#111] focus:ring-0 rounded-[14px] outline-none transition-colors text-[14px] text-[#111] placeholder:text-gray-400 font-medium"
              />
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </div>
            </div>
            
            {view === "login" && (
              <div className="w-full text-right mt-1.5">
                <a href="#" className="text-[11px] font-semibold text-gray-500 hover:text-[#111]">Forgot password?</a>
              </div>
            )}
          </div>

          {/* Confirm Password (Signup only) */}
          {view === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#111]">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password" 
                  className="w-full h-[46px] pl-[44px] pr-10 bg-transparent border-[1.5px] border-gray-200 focus:border-[#111] focus:ring-0 rounded-[14px] outline-none transition-colors text-[14px] text-[#111] placeholder:text-gray-400 font-medium"
                />
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "signup" && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  required
                  className="peer appearance-none w-[18px] h-[18px] border-[1.5px] border-gray-300 rounded-[4px] checked:bg-[#111] checked:border-[#111] transition-colors cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                I agree to the <a href="#" className="text-[#111] underline underline-offset-2">Terms</a> and <a href="#" className="text-[#111] underline underline-offset-2">Privacy Policy</a>
              </span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full h-[48px] ${view === "login" ? "mt-4" : "mt-2"} bg-[#3A2034] text-white rounded-[14px] font-semibold text-[14px] hover:bg-[#261522] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : view === "login" || view === "admin" ? "Log In" : "Create Account"}
          </button>
        </form>

        {view !== "admin" && (
          <div className="w-full flex items-center gap-4 my-6 opacity-30">
            <div className="h-[1px] flex-1 bg-gray-400"></div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#111"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <div className="h-[1px] flex-1 bg-gray-400"></div>
          </div>
        )}

        {view === "login" && (
          <p className="text-[12px] font-semibold text-gray-500 mb-6">
            Don't have an account? <button onClick={() => switchView("signup")} className="text-[#111] underline underline-offset-2 ml-1">Sign up</button>
          </p>
        )}
        
        {view === "signup" && (
          <p className="text-[12px] font-semibold text-gray-500 mb-6">
            Already have an account? <button onClick={() => switchView("login")} className="text-[#111] underline underline-offset-2 ml-1">Log in</button>
          </p>
        )}

        {view !== "admin" && (
          <button 
            onClick={() => switchView("admin")}
            className="w-full h-[42px] border-[1.5px] border-gray-200 bg-transparent text-[#111] rounded-[14px] font-semibold text-[13px] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="3"/><path d="M7 16a5 5 0 0 1 10 0"/></svg>
            Admin Login
          </button>
        )}

      </section>
    </div>
  );
}
