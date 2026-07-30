"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, signupAction } from "@/app/actions/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await loginAction(username, password);
        if (res.success) {
          router.push("/room");
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

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-white text-[#3A2034] p-4 font-sans selection:bg-[#D97A89] selection:text-white overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D97A89]/10 blur-[100px] mix-blend-multiply pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#3A2034]/5 blur-[120px] mix-blend-multiply pointer-events-none animate-pulse duration-1000" style={{ animationDelay: '500ms' }}></div>

      <div className="relative w-full max-w-[440px] bg-white/70 backdrop-blur-2xl p-10 sm:p-14 rounded-[40px] shadow-[0_24px_80px_rgba(58,32,52,0.07)] border border-white/60 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        
        {/* Decorative Mark */}
        <div className="mb-8 w-14 h-14 bg-gradient-to-br from-white to-slate-100/60 rounded-[20px] flex items-center justify-center text-[#D97A89] shadow-[0_4px_20px_rgba(217,122,137,0.15)] border border-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-10">
          <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#3A2034] leading-tight">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[15px] font-medium text-gray-500/90 max-w-[280px]">
            {isLogin ? "Enter your details to access your private space." : "Join the private space."}
          </p>
        </div>

        {formError && (
          <div className="w-full mb-8 p-4 bg-white/80 backdrop-blur-md border border-[#D97A89]/30 text-[#D97A89] rounded-2xl text-[14px] text-center font-semibold shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          
          <div className="flex flex-col gap-2 group">
            <label className="text-[11px] font-bold text-[#3A2034]/60 uppercase tracking-[0.1em] ml-1 transition-colors group-focus-within:text-[#D97A89]">Username</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFormError("");
                }}
                placeholder="Enter your username" 
                className="w-full py-3.5 px-5 bg-white/50 border border-[#EEE7F7] focus:border-[#D97A89]/50 focus:bg-white focus:ring-4 focus:ring-[#D97A89]/10 rounded-[20px] outline-none transition-all placeholder-gray-400/80 text-[15px] font-semibold text-[#3A2034] shadow-sm hover:border-[#D97A89]/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="text-[11px] font-bold text-[#3A2034]/60 uppercase tracking-[0.1em] ml-1 transition-colors group-focus-within:text-[#D97A89]">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError("");
                }}
                placeholder="••••••••" 
                className="w-full py-3.5 px-5 bg-white/50 border border-[#EEE7F7] focus:border-[#D97A89]/50 focus:bg-white focus:ring-4 focus:ring-[#D97A89]/10 rounded-[20px] outline-none transition-all placeholder-gray-400/80 text-[15px] font-semibold text-[#3A2034] shadow-sm hover:border-[#D97A89]/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 mb-4 px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-[2.5px] border-[#EEE7F7] rounded-lg checked:border-[#D97A89] checked:bg-[#D97A89] transition-all cursor-pointer hover:border-[#D97A89]/50 focus:outline-none focus:ring-4 focus:ring-[#D97A89]/20"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none scale-50 opacity-0 peer-checked:scale-100 peer-checked:opacity-100 transition-all duration-300 ease-out" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[14px] font-semibold text-[#3A2034]/70 group-hover:text-[#3A2034] transition-colors">Remember me</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="group relative w-full py-4 bg-gradient-to-r from-[#3A2034] to-[#4A2943] text-white rounded-[20px] font-bold text-[15px] hover:from-[#261522] hover:to-[#3A2034] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(58,32,52,0.25)] hover:shadow-[0_12px_40px_rgba(58,32,52,0.35)] flex items-center justify-center gap-2 overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
            
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span className="relative z-10">{isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}</span>
          </button>
        </form>

        <div className="mt-10 w-full text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError("");
              setUsername("");
              setPassword("");
            }} 
            className="text-[14px] font-semibold text-gray-500 hover:text-[#3A2034] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D97A89]/20 rounded-lg px-3 py-1"
          >
            {isLogin ? (
              <span>New here? <span className="text-[#D97A89] ml-1">Sign up</span></span>
            ) : (
              <span>Already have an account? <span className="text-[#D97A89] ml-1">Sign in</span></span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
