"use client";

import { useEffect, useState } from "react";
import { getDashboardMetrics } from "@/app/actions/admin";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    todayNewUsers: 0,
    deletedUsers: 0,
    suspendedUsers: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 border border-red-500/20 bg-red-500/5 rounded-2xl">
        <p className="text-red-400 font-mono text-sm">Failed to load metrics: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-400 mt-1">Live statistics from the production database.</p>
        </div>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={metrics.totalUsers} trend="Non-deleted profiles" loading={isLoading} />
        <MetricCard title="Active Profiles" value={metrics.activeUsers} trend="Not suspended or deleted" highlight loading={isLoading} />
        <MetricCard title="Total Messages" value={metrics.totalMessages} trend="Across all chats" loading={isLoading} />
        <MetricCard title="Total Chats" value={metrics.totalChats} trend="Conversations" loading={isLoading} />
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Online Now" value={metrics.onlineUsers} trend="Last 5 min" loading={isLoading} small />
        <MetricCard title="New Today" value={metrics.todayNewUsers} trend="Registered today" loading={isLoading} small />
        <MetricCard title="Suspended" value={metrics.suspendedUsers} trend="Active suspensions" loading={isLoading} small warning />
        <MetricCard title="Deleted" value={metrics.deletedUsers} trend="In trash" loading={isLoading} small danger />
      </div>

      {/* Media Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Media Messages Breakdown</h2>
          <p className="text-xs text-zinc-500">Count of messages by type (not storage size)</p>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <MediaStat label="Images" count={metrics.images} color="bg-blue-500" loading={isLoading} />
            <MediaStat label="Videos" count={metrics.videos} color="bg-purple-500" loading={isLoading} />
            <MediaStat label="Audio" count={metrics.audio} color="bg-emerald-500" loading={isLoading} />
            <MediaStat label="Docs" count={metrics.documents} color="bg-orange-500" loading={isLoading} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Data Source</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>User counts</span>
              <span className="text-emerald-400 font-mono text-xs">public.profiles</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Message counts</span>
              <span className="text-emerald-400 font-mono text-xs">public.messages</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Chat counts</span>
              <span className="text-emerald-400 font-mono text-xs">public.conversations</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Online detection</span>
              <span className="text-emerald-400 font-mono text-xs">last_seen &gt; 5min</span>
            </div>
            <div className="border-t border-zinc-800 pt-3 mt-3">
              <p className="text-xs text-zinc-500">
                All metrics are queried live from the production Supabase database via service role. No cached, mocked, or estimated values.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, highlight = false, loading = false, small = false, warning = false, danger = false }: any) {
  let borderClass = 'bg-zinc-900 border-zinc-800';
  let textClass = 'text-zinc-400';

  if (highlight) {
    borderClass = 'bg-white text-black border-white';
    textClass = 'text-zinc-500';
  } else if (warning) {
    borderClass = 'bg-yellow-500/5 border-yellow-500/20';
  } else if (danger) {
    borderClass = 'bg-red-500/5 border-red-500/20';
  }

  return (
    <div className={`${small ? 'p-4' : 'p-6'} rounded-2xl border ${borderClass}`}>
      <h3 className={`text-sm font-medium ${textClass}`}>{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <div className={`${small ? 'h-6 w-16' : 'h-8 w-24'} rounded animate-pulse ${highlight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
        ) : (
          <span className={`${small ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>{value.toLocaleString()}</span>
        )}
      </div>
      <div className={`mt-1 text-xs font-medium ${highlight ? 'text-emerald-600' : warning ? 'text-yellow-500' : danger ? 'text-red-400' : 'text-emerald-400'}`}>
        {loading ? '...' : trend}
      </div>
    </div>
  );
}

function MediaStat({ label, count, color, loading }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      {loading ? (
        <div className="w-12 h-4 bg-zinc-800 rounded animate-pulse"></div>
      ) : (
        <span className="text-sm font-semibold">{count.toLocaleString()}</span>
      )}
    </div>
  );
}
