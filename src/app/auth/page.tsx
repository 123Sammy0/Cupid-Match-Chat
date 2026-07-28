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
    <div className="flex min-h-screen w-full items-center justify-center bg-white text-black p-4">
      <div className="w-full max-w-[400px] p-8 flex flex-col items-center">
        
        {/* Logo / Icon */}
        <div className="mb-2 text-2xl font-serif italic font-bold">,</div>
        
        {/* Header */}
        <h1 className="text-4xl font-normal tracking-tight mb-2">
          {isLogin ? "Log in" : "Sign up"}
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          {isLogin ? "Log in to continue" : "Sign up to continue"}
        </p>

        {formError && (
          <div className="w-full mb-6 p-3 bg-red-50 text-red-600 rounded-md text-sm text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          
          <div className="relative">
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFormError("");
              }}
              placeholder="Username" 
              className="w-full py-2 border-b border-gray-300 focus:border-[#1877F2] focus:outline-none transition-colors bg-transparent placeholder-gray-400 text-[15px]"
            />
          </div>

          <div className="relative">
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Password" 
              className="w-full py-2 border-b border-gray-300 focus:border-[#1877F2] focus:outline-none transition-colors bg-transparent placeholder-gray-400 text-[15px]"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-[#1877F2] text-white rounded-md font-medium hover:bg-[#166FE5] transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
          >
            {isLoading ? "Please wait..." : (isLogin ? "Log in" : "Sign up")}
          </button>

          <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              id="remember"
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[18px] h-[18px] rounded-[3px] border-gray-300 text-[#1877F2] focus:ring-[#1877F2] cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
              Remember me
            </label>
          </div>
        </form>

        <div className="mt-8 text-sm">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError("");
              setUsername("");
              setPassword("");
            }} 
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}
