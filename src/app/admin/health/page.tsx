"use client";

import { useEffect, useState } from "react";

export default function SystemHealthPage() {
  const [status, setStatus] = useState({
    supabase: "checking",
    auth: "checking",
    realtime: "checking",
    storage: "checking",
    api: "checking"
  });

  useEffect(() => {
    // Mocking health checks for Phase 2 UI
    setTimeout(() => {
      setStatus({
        supabase: "operational",
        auth: "operational",
        realtime: "operational",
        storage: "degraded", // Mock a warning state
        api: "operational"
      });
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-zinc-400 mt-1">Real-time status of backend services and APIs.</p>
      </div>

      <div className="flex flex-col gap-4">
        <HealthRow service="Supabase Database" status={status.supabase} description="Core PostgreSQL database and RLS policies." />
        <HealthRow service="Authentication" status={status.auth} description="GoTrue authentication service." />
        <HealthRow service="Realtime Channels" status={status.realtime} description="WebSocket connections for live typing and online status." />
        <HealthRow service="Media Storage" status={status.storage} description="S3-compatible object storage for images and videos." />
        <HealthRow service="Next.js API Routes" status={status.api} description="Serverless functions for application logic." />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
        <h2 className="text-lg font-semibold mb-2">Recent System Logs</h2>
        <div className="bg-black rounded-lg p-4 font-mono text-xs text-zinc-400 flex flex-col gap-2 h-48 overflow-y-auto">
          <div className="text-emerald-500">[2026-08-06 14:05:22] System check passed. All services nominal.</div>
          <div className="text-emerald-500">[2026-08-06 14:15:00] Realtime reconnect spike handled successfully.</div>
          <div className="text-yellow-500">[2026-08-06 14:42:19] Storage warning: Bucket 'chat-media' approaching 80% capacity.</div>
          <div className="text-emerald-500">[2026-08-06 15:00:00] Scheduled backup completed.</div>
        </div>
      </div>
    </div>
  );
}

function HealthRow({ service, status, description }: { service: string; status: string; description: string }) {
  const getStatusColor = () => {
    if (status === "checking") return "bg-zinc-500 animate-pulse";
    if (status === "operational") return "bg-emerald-500";
    if (status === "degraded") return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (status === "checking") return "Checking...";
    if (status === "operational") return "Operational";
    if (status === "degraded") return "Degraded";
    return "Outage";
  };

  return (
    <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="flex flex-col">
        <h3 className="font-semibold text-white">{service}</h3>
        <p className="text-sm text-zinc-400 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm font-medium text-zinc-300">{getStatusText()}</span>
      </div>
    </div>
  );
}
