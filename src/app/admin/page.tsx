"use client";

import { useEffect, useState } from "react";
// We will import Server Actions for data fetching here once the backend logic is complete.

export default function AdminDashboard() {
  // In a real implementation, we would fetch this from a Server Action: `getDashboardMetrics()`
  // For the UI placeholder, we'll use state to represent loading.
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    totalStorageMB: 0,
    todayNewUsers: 0,
    activeRooms: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch delay for Phase 2 UI building
    setTimeout(() => {
      setMetrics({
        totalUsers: 1245,
        onlineUsers: 87,
        totalChats: 890,
        totalMessages: 12450,
        images: 4500,
        videos: 320,
        audio: 1200,
        documents: 50,
        totalStorageMB: 12500,
        todayNewUsers: 45,
        activeRooms: 12,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-1">Live statistics and platform health.</p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={metrics.totalUsers} trend="+12% this week" loading={isLoading} />
        <MetricCard title="Online Users" value={metrics.onlineUsers} trend="Live" highlight loading={isLoading} />
        <MetricCard title="Total Messages" value={metrics.totalMessages} trend="+5k today" loading={isLoading} />
        <MetricCard title="Storage Used" value={`${(metrics.totalStorageMB / 1024).toFixed(2)} GB`} trend="Stable" loading={isLoading} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Platform Activity (Last 7 Days)</h2>
          <div className="h-64 flex items-end gap-2 justify-between">
            {/* Mock Chart */}
            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
              <div key={i} className="w-full bg-zinc-800 rounded-t-md relative group" title={`${h} activity score`}>
                <div 
                  className="absolute bottom-0 w-full bg-white rounded-t-md transition-all duration-1000" 
                  style={{ height: isLoading ? "0%" : `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Media Breakdown</h2>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <MediaStat label="Images" count={metrics.images} color="bg-blue-500" loading={isLoading} />
            <MediaStat label="Videos" count={metrics.videos} color="bg-purple-500" loading={isLoading} />
            <MediaStat label="Audio" count={metrics.audio} color="bg-emerald-500" loading={isLoading} />
            <MediaStat label="Docs" count={metrics.documents} color="bg-orange-500" loading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, highlight = false, loading = false }: any) {
  return (
    <div className={`p-6 rounded-2xl border ${highlight ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800'}`}>
      <h3 className={`text-sm font-medium ${highlight ? 'text-zinc-500' : 'text-zinc-400'}`}>{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <div className={`h-8 w-24 rounded animate-pulse ${highlight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
        ) : (
          <span className="text-3xl font-bold tracking-tight">{value}</span>
        )}
      </div>
      <div className={`mt-2 text-xs font-medium ${highlight ? 'text-emerald-600' : 'text-emerald-400'}`}>
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
