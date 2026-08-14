"use client";

import { useState, useRef, KeyboardEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyAccessCode } from "@/app/actions/gate";

export default function Gate() {
  const [pins, setPins] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const router = useRouter();

  const isComplete = pins.every(p => p.length === 1);

  const handlePinChange = (index: number, value: string) => {
    // Only accept numeric characters
    if (!/^\d*$/.test(value)) return;
    
    const newPins = [...pins];

    // Handle pasting multiple digits (e.g. 1234)
    if (value.length > 1) {
      const pasted = value.slice(0, 4).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 4) newPins[index + i] = pasted[i];
      }
      setPins(newPins);
      const nextIndex = Math.min(index + pasted.length, 3);
      inputRefs[nextIndex].current?.focus();
    } else {
      newPins[index] = value;
      setPins(newPins);
      if (value && index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    }
    setError("");
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pins[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const pin = pins.join("");
    if (pin.length !== 4) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await verifyAccessCode(pin);
      if (result.success) {
        router.push("/auth");
      } else {
        setError(result.message || "Invalid passkey. Access denied.");
        setPins(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError("Unable to connect to gate server.");
      setPins(["", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gate-container">
      {/* Background Ambient Glows */}
      <div className="absolute top-12 left-12 w-64 h-64 bg-[#B5D2E6]/30 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute bottom-16 right-16 w-80 h-80 bg-[#805232]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-44 h-44 bg-[#B5D2E6]/20 rounded-full blur-[60px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <section className="glass-auth-card">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#805232" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-[18px] font-bold tracking-tight text-[#326080]">Cupid Match</h1>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#8BAAB8] uppercase">Private Communication</span>
        </div>

        {/* Floating Heart Graphic */}
        <div className="relative w-32 h-28 mb-6 flex items-center justify-center">
          <div className="relative">
            <svg width="72" height="66" viewBox="0 0 24 24" fill="none" stroke="#326080" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <div className="absolute -bottom-1 -right-2 bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-[#326080]/5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#805232">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <h2 className="text-[20px] font-semibold tracking-tight text-[#326080] mb-1">{"Gate Pass"}</h2>
        <p className="text-[13px] text-[#5A7A90] mb-8 text-center max-w-[260px] leading-relaxed">
          Enter the 4-digit room passkey to proceed to private chambers.
        </p>

        {/* PIN Entry Form - Supports Keyboard and Mobile Enter Key Submission */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <div className="flex gap-3 mb-6 w-full justify-center">
            {pins.map((p, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={p}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="pin-digit-input"
                autoFocus={i === 0}
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-xs text-rose-600 font-medium tracking-wide">
              {error}
            </div>
          )}

          {/* Submit Button (Type submit triggers on mobile keyboard Enter/Go) */}
          <button 
            type="submit"
            className="w-full h-[50px] bg-[#326080] text-white rounded-full font-semibold text-[14.5px] hover:bg-[#2A5270] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(50,96,128,0.2)]" 
            disabled={isLoading || !isComplete}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Unlock & Enter"}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#326080]/5 w-full flex items-center justify-between text-[11px] text-[#8BAAB8] font-mono">
          <span>SECURE 256-BIT</span>
          <button 
            onClick={() => window.location.href = '/'}
            className="hover:text-[#326080] transition-colors underline underline-offset-2"
          >
            Return to library
          </button>
        </div>
      </section>

      <p className="absolute bottom-6 text-[11px] text-[#8BAAB8] font-mono tracking-wider">
        © 2026 CUPID MATCH • ALL RIGHTS RESERVED
      </p>
    </div>
  );
}
