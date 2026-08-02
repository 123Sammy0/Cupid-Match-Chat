"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { verifyAccessCode } from "@/app/actions/gate";

export default function Gate() {
  const [pins, setPins] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const router = useRouter();

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPins = [...pins];
    // If pasting multiple digits
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
    }
  };

  const handleSubmit = async () => {
    const pin = pins.join("");
    if (pin.length !== 4) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await verifyAccessCode(pin);
      if (result.success) {
        router.push("/auth");
      } else {
        setError(result.message || "Invalid code");
        setPins(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError("An error occurred");
      setPins(["", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = pins.every(p => p.length === 1);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#fafafa] text-[#111] font-sans px-4 py-8 relative overflow-hidden">
      
      {/* Subtle background blurs based on new layout's background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gray-200/40 rounded-full blur-[40px] pointer-events-none"></div>
      <div className="absolute top-20 right-10 w-24 h-24 bg-gray-200/40 rounded-full blur-[30px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-gray-200/40 rounded-full blur-[50px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-gray-200/40 rounded-full blur-[60px] pointer-events-none"></div>

      <section className="relative w-full max-w-[380px] bg-white rounded-[24px] shadow-[0_4px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="22" height="20" viewBox="0 0 24 24" fill="#111" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-[17px] font-bold tracking-tight">Cupid Match</h1>
          </div>
          <p className="text-[11px] text-gray-400 font-medium tracking-wide">Find your perfect match</p>
        </div>

        {/* Center Illustration */}
        <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
          {/* Sparkles */}
          <svg className="absolute top-2 left-2 text-gray-300 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7"/></svg>
          <svg className="absolute bottom-6 -right-2 text-gray-300 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7"/></svg>
          <svg className="absolute top-1/2 -right-6 text-gray-200 w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M22 12H2"/></svg>
          
          {/* Large Heart Outline */}
          <div className="relative">
            <svg width="84" height="76" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {/* Small Heart Overlay */}
            <div className="absolute -bottom-1 -right-3 bg-white rounded-full p-1 shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <h2 className="text-[20px] font-bold mb-2">Gate Entry</h2>
        <p className="text-[13px] text-gray-500 mb-8 text-center px-4 leading-[1.6]">
          Please enter the 4-digit gate pass<br/>to continue
        </p>

        {/* PIN Inputs */}
        <div className="flex gap-3 mb-10 w-full justify-center">
          {pins.map((p, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={p}
              onChange={(e) => handlePinChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-[52px] h-[64px] text-center text-[28px] font-medium bg-transparent border-[1.5px] border-gray-200 focus:border-[#111] focus:ring-0 rounded-[14px] outline-none transition-colors text-[#111]"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-[#D97A89] font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </p>
        )}

        <div className="w-full flex items-center gap-4 my-2 opacity-30">
          <div className="h-[1px] flex-1 bg-gray-400"></div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#111"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <div className="h-[1px] flex-1 bg-gray-400"></div>
        </div>

        <button 
          className="w-full h-[52px] mt-6 bg-[#3A2034] text-white rounded-full font-semibold text-[15px] hover:bg-[#261522] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
          onClick={handleSubmit}
          disabled={isLoading || !isComplete}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Enter"}
        </button>
      </section>

      <p className="absolute bottom-8 text-[11px] text-gray-400 font-medium tracking-wide">
        © 2026 Cupid Match. All rights reserved.
      </p>
    </div>
  );
}
