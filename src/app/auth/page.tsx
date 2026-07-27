"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, signupAction } from "@/app/actions/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [roomCode, setRoomCode] = useState(""); // Only for signup
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await loginAction(username, password, accessCode);
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
        const res = await signupAction(username, password, accessCode, roomCode);
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
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF6EE]">
      <section className="auth-card" role="dialog" aria-modal="true">
        <button className="close-btn" aria-label="Return to library" onClick={() => router.push("/")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        <div className="auth-mark" aria-hidden="true">✦</div>
        <p className="eyebrow">Private space</p>
        <h2 className="text-2xl font-semibold mb-2">{isLogin ? "Welcome back" : "Create Account"}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {isLogin ? "Enter your details to open your room." : "This space is limited to two people."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label block mb-4">
            <span className="block text-sm font-medium mb-1">Username</span>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name" 
              className="w-full p-2 border rounded-lg bg-white/50"
            />
          </label>

          <label className="field-label block mb-4">
            <span className="block text-sm font-medium mb-1">Password</span>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-2 border rounded-lg bg-white/50"
            />
          </label>

          {!isLogin && (
            <label className="field-label block mb-4">
              <span className="block text-sm font-medium mb-1">Confirm password</span>
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full p-2 border rounded-lg bg-white/50"
              />
            </label>
          )}

          <label className="field-label block mb-4">
            <span className="block text-sm font-medium mb-1">Access code (4-digit)</span>
            <input 
              type="password" 
              maxLength={4}
              required 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••" 
              className="w-full p-2 border rounded-lg bg-white/50"
            />
          </label>

          {!isLogin && (
            <label className="field-label block mb-4">
              <span className="block text-sm font-medium mb-1">Room code (Optional on first setup)</span>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. moonlight-27" 
                className="w-full p-2 border rounded-lg bg-white/50"
              />
            </label>
          )}

          <button className="btn btn-primary btn-full mt-2 w-full p-3 rounded-lg text-white font-semibold" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : (isLogin ? "Log in" : "Create private account")}
          </button>
        </form>

        <button className="toggle-link text-sm text-gray-500 mt-4 block w-full text-center hover:text-black" onClick={() => { setIsLogin(!isLogin); setError(""); }}>
          {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
        
        {error && <p className="form-message mt-4 text-red-500 text-sm text-center" role="alert">{error}</p>}
      </section>
    </div>
  );
}
