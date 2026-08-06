import { ReactNode } from "react";
import Link from "next/link";
import { verifySuperAdmin } from "@/app/actions/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Pre-flight check: Verify super admin access before rendering anything in the layout
  await verifySuperAdmin();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span className="font-bold tracking-wide">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <NavLink href="/admin" icon="dashboard">Dashboard</NavLink>
          <NavLink href="/admin/users" icon="users">Users & Roles</NavLink>
          <NavLink href="/admin/chats" icon="message-square">Chat Monitor</NavLink>
          <NavLink href="/admin/storage" icon="hard-drive">Storage Mgt.</NavLink>
          <NavLink href="/admin/rooms" icon="box">Rooms & Gate</NavLink>
          
          <div className="my-4 border-t border-zinc-800 mx-2"></div>
          
          <NavLink href="/admin/health" icon="activity">System Health</NavLink>
          <NavLink href="/admin/trash" icon="trash-2">Trash & Recovery</NavLink>
          <NavLink href="/admin/logs" icon="list">Audit Logs</NavLink>
          <NavLink href="/admin/settings" icon="settings">Global Settings</NavLink>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
            <Icon name="log-out" />
            <span>Exit to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Command Palette Placeholder */}
            <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400 font-mono flex items-center gap-2">
              <Icon name="search" size={12} />
              Global Search (Ctrl+K)
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <Icon name="bell" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-zinc-950"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Simple Helper Components for Layout
function NavLink({ href, icon, children }: { href: string; icon: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors group">
      <Icon name={icon} className="group-hover:text-white" />
      <span>{children}</span>
    </Link>
  );
}

function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const icons: Record<string, ReactNode> = {
    dashboard: <path d="M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z"/>,
    users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"/>,
    "message-square": <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    "hard-drive": <path d="M22 12H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z M6 16h.01 M10 16h.01"/>,
    box: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12"/>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    "trash-2": <path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6"/>,
    list: <line x1="8" y1="6" x2="21" y2="6"/>,
    settings: <circle cx="12" cy="12" r="3"/>, // simplified
    "log-out": <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"/>,
    search: <circle cx="11" cy="11" r="8"/>,
    bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"/>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name] || <circle cx="12" cy="12" r="10"/>}
    </svg>
  );
}
