"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VersionMonitor() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const currentVersion = process.env.NEXT_PUBLIC_BUILD_VERSION;
    console.log("VersionMonitor init. currentVersion:", currentVersion);
    
    // If we're in dev and didn't set a version, or it's missing, ignore
    if (!currentVersion) {
      console.log("No currentVersion, exiting monitor.");
      return;
    }

    const checkForUpdate = async () => {
      console.log("Checking for update...");
      try {
        const res = await fetch("/api/version", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        
        if (!res.ok) {
          console.log("Fetch not ok:", res.status);
          return;
        }
        
        const data = await res.json();
        const serverVersion = data.version;
        console.log("Server version:", serverVersion);

        if (serverVersion && serverVersion !== 'dev' && serverVersion !== currentVersion) {
          console.log("Version mismatch! Showing toast.");
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    // Check immediately on mount
    checkForUpdate();

    // Check every 5 minutes
    checkInterval.current = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Also check when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]); // Re-run check on route change

  if (!updateAvailable) return null;

  return (
    <div 
      id="version-update-toast"
      className="fixed bottom-6 right-6 z-[9999] bg-[#805232] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 animate-fade-in-up cursor-pointer hover:bg-[#6c442a] transition-colors"
      onClick={() => window.location.reload()}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl">✦</span>
      <span className="text-sm font-medium tracking-wide">A new version is available. Click to refresh.</span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
