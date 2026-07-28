"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, signupAction } from "@/app/actions/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await loginAction(username, password);
        if (res.success) {
          router.push("/room");
        } else {
          setError(res.message || "Login failed");
        }
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        
        const res = await signupAction(username, password);
        if (res.success) {
          router.push("/room");
        } else {
          setError(res.message || "Signup failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-black overflow-y-auto">
      <section className="auth-card border border-gray-200 shadow-sm bg-white m-4" role="dialog" aria-modal="true" style={{maxWidth: '400px', width: '100%', padding: '32px', borderRadius: '16px', position: 'relative'}}>
        <button className="close-btn" aria-label="Return to library" onClick={() => router.push("/")} style={{position: 'absolute', top: '16px', right: '16px', color: 'black', background: 'transparent', border: 'none', cursor: 'pointer'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        <div className="auth-mark text-black text-center text-2xl mb-4" aria-hidden="true">✦</div>
        <p className="eyebrow text-gray-500 text-xs tracking-widest uppercase text-center mb-2">Private space</p>
        <h2 className="text-2xl font-bold mb-2 text-center text-black">{isLogin ? "Welcome back" : "Create Account"}</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {isLogin ? "Enter your details to open your room." : "Sign up to join the private room."}
        </p>

        {error && <div className="mb-4 p-3 bg-gray-100 text-black border border-gray-300 rounded text-sm text-center font-medium">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label block mb-4">
            <span className="block text-sm font-semibold mb-1 text-black">Username</span>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name" 
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </label>

          <label className="field-label block mb-4 relative">
            <span className="block text-sm font-semibold mb-1 text-black">Password</span>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>

          {!isLogin && (
            <label className="field-label block mb-6 relative">
              <span className="block text-sm font-semibold mb-1 text-black">Confirm Password</span>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black pr-10"
                />
              </div>
            </label>
          )}

          <button className="w-full p-3 rounded-full bg-black text-white font-bold hover:bg-gray-800 transition-colors mb-4" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : (isLogin ? "Log in" : "Create Account")}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }} 
            className="text-sm text-gray-500 hover:text-black underline transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </section>
    </div>
  );
}
