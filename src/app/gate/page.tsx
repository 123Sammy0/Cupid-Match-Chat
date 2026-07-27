"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAccessCode } from "@/app/actions/gate";

export default function Gate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await verifyAccessCode(pin);
      if (result.success) {
        router.push("/auth"); // Proceed to login/signup area
      } else {
        setError(result.message || "Invalid code");
        setPin(""); // reset on fail
      }
    } catch (err) {
      setError("An error occurred");
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
        <h2 className="text-2xl font-semibold mb-2">Gate Entry</h2>
        <p className="text-sm text-gray-500 mb-6">Enter the 4-digit access code to proceed.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label">
            Access Code
            <input 
              type="password" 
              maxLength={4}
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required 
              placeholder="••••" 
              className="text-center text-2xl tracking-[1em] w-full p-3 border rounded-lg bg-white/50"
              autoFocus
            />
          </label>

          <button className="btn btn-primary btn-full mt-6" type="submit" disabled={isLoading || pin.length !== 4}>
            {isLoading ? "Verifying..." : "Enter"}
          </button>
        </form>

        {error && <p className="form-message mt-4 text-red-500" role="alert">{error}</p>}
      </section>
    </div>
  );
}
