import { ReactNode } from "react";
import Link from "next/link";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminSidebarClient from "./AdminSidebarClient";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Pre-flight check: Verify super admin access before rendering anything in the layout
  await verifyAdmin();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Client-side sidebar handles mobile menu state */}
      <AdminSidebarClient />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle (visible only on mobile) */}
            <MobileMenuToggle />
            <div className="hidden sm:flex px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400 font-mono items-center gap-2">
              <SearchIcon size={12} />
              Global Search (Ctrl+K)
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-zinc-950"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Client component for mobile menu toggle - emits custom event
function MobileMenuToggle() {
  return (
    <button
      className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
      onClick={() => {
        // This won't work in server component, handled by AdminSidebarClient
      }}
      aria-label="Toggle sidebar"
      id="admin-mobile-menu-toggle"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  );
}

// Simple icon helpers (server-safe)
function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
