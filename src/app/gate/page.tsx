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
        router.push("/auth");
      } else {
        setError(result.message || "Invalid code");
        setPin("");
      }
    } catch (err) {
      setError("An error occurred");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-[#3A2034] font-sans selection:bg-[#D97A89] selection:text-white">
      <section className="relative w-full max-w-[380px] bg-white p-10 sm:p-12 rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-[#EEE7F7]/50 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        
        <button 
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#3A2034] hover:bg-slate-100/60 rounded-full transition-colors" 
          aria-label="Return to library" 
          onClick={() => router.push("/")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="mb-8 w-12 h-12 bg-slate-100/60 rounded-full flex items-center justify-center text-[#D97A89]" aria-hidden="true">
          <span className="text-2xl font-serif">✦</span>
        </div>
        
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D97A89] mb-2">Private space</p>
        <h2 className="text-2xl font-semibold mb-2">Enter PIN</h2>
        <p className="text-sm text-gray-500 mb-8 text-center">Please provide your 4-digit access code to proceed.</p>

        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-6">
          <div className="relative flex justify-center">
            <input 
              type="password" 
              maxLength={4}
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required 
              placeholder="••••" 
              className="text-center text-4xl tracking-[0.5em] w-full py-4 bg-slate-100/60 border border-transparent focus:border-[#D97A89]/50 focus:bg-white focus:ring-4 focus:ring-[#D97A89]/10 rounded-2xl outline-none transition-all text-[#3A2034] font-mono placeholder-gray-300"
              autoFocus
            />
          </div>

          <button 
            className="w-full py-3.5 bg-[#3A2034] text-white rounded-2xl font-semibold hover:bg-[#261522] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#3A2034]/20 flex items-center justify-center gap-2" 
            type="submit" 
            disabled={isLoading || pin.length !== 4}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Unlock"}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-sm text-[#D97A89] font-medium bg-white px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
