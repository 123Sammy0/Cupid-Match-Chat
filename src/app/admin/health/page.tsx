"use client";

import { useEffect, useState } from "react";
import { getSystemHealth, getAuditLogs } from "@/app/actions/admin";

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<Record<string, { status: string; latencyMs: number; detail?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [lastChecked, setLastChecked] = useState<string>("");

  const runHealthCheck = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [health, logs] = await Promise.all([
        getSystemHealth(),
        getAuditLogs()
      ]);
      setHealthData(health);
      setRecentLogs(logs.slice(0, 5));
      setLastChecked(new Date().toLocaleString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const serviceMap: Record<string, { label: string; description: string }> = {
    database: { label: "Supabase Database", description: "Core PostgreSQL database and RLS policies." },
    auth: { label: "Authentication", description: "GoTrue authentication service." },
    messaging_db: { label: "Messaging DB", description: "Direct connectivity to the messages table." },
    storage: { label: "Media Storage", description: "S3-compatible object storage for images and videos." },
    api: { label: "Next.js API Routes", description: "Serverless functions for application logic." },
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-zinc-400 mt-1">Live status of backend services and APIs.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && <span className="text-xs text-zinc-500">Last check: {lastChecked}</span>}
          <button
            onClick={runHealthCheck}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Checking..." : "Run Health Check"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {Object.entries(serviceMap).map(([key, info]) => {
          const health = healthData[key];
          return (
            <HealthRow
              key={key}
              service={info.label}
              status={isLoading ? "checking" : (health?.status || "unknown")}
              description={info.description}
              latencyMs={health?.latencyMs}
              detail={health?.detail}
            />
          );
        })}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
        <h2 className="text-lg font-semibold mb-2">Recent Admin Activity</h2>
        <div className="bg-black rounded-lg p-4 font-mono text-xs text-zinc-400 flex flex-col gap-2 h-48 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="text-zinc-500">No recent admin audit logs found.</div>
          ) : (
            recentLogs.map((log, i) => (
              <div key={log.id || i} className="text-emerald-500">
                [{new Date(log.created_at).toISOString().slice(0, 19).replace('T', ' ')}] {log.action}
                {log.profiles?.username ? ` by ${log.profiles.username}` : ''}
                {log.target_user_id ? ` → user:${log.target_user_id.substring(0, 8)}` : ''}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HealthRow({ service, status, description, latencyMs, detail }: {
  service: string; status: string; description: string; latencyMs?: number; detail?: string;
}) {
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
    if (status === "unknown") return "Unknown";
    return "Error";
  };

  return (
    <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="flex flex-col">
        <h3 className="font-semibold text-white">{service}</h3>
        <p className="text-sm text-zinc-400 mt-1">{description}</p>
        {detail && status !== 'operational' && (
          <p className="text-xs text-red-400 mt-1 font-mono">{detail}</p>
        )}
      </div>
      <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800 flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-300">{getStatusText()}</span>
          {latencyMs !== undefined && status !== 'checking' && (
            <span className="text-[10px] text-zinc-500">{latencyMs}ms</span>
          )}
        </div>
      </div>
    </div>
  );
}
