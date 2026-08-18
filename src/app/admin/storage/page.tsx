"use client";

import { useState, useEffect } from "react";
import { getStorageStats, getStorageFiles, deleteStorageFile } from "@/app/actions/admin";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function StorageManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stats, setStats] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getStorageStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const data = await getStorageFiles(searchQuery || undefined, typeFilter);
      setFiles(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => { loadStats(); loadFiles(); }, []);

  const handleSearch = () => { loadFiles(); };
  const handleFilterChange = (val: string) => {
    setTypeFilter(val);
    // Reload with new filter after state update
    setTimeout(() => loadFiles(), 0);
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.name}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteStorageFile(file.bucket, file.path);
      await loadStats();
      await loadFiles();
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
          <p className="text-zinc-400 mt-1">Real storage usage from Supabase Storage buckets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadStats(); loadFiles(); }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StorageCard
          title="Images"
          size={isLoadingStats ? "..." : formatBytes(stats?.image?.bytes || 0)}
          count={isLoadingStats ? "..." : `${stats?.image?.count || 0} files`}
          color="bg-blue-500"
          loading={isLoadingStats}
        />
        <StorageCard
          title="Videos"
          size={isLoadingStats ? "..." : formatBytes(stats?.video?.bytes || 0)}
          count={isLoadingStats ? "..." : `${stats?.video?.count || 0} files`}
          color="bg-purple-500"
          loading={isLoadingStats}
        />
        <StorageCard
          title="Audio / Voice"
          size={isLoadingStats ? "..." : formatBytes(stats?.audio?.bytes || 0)}
          count={isLoadingStats ? "..." : `${stats?.audio?.count || 0} files`}
          color="bg-emerald-500"
          loading={isLoadingStats}
        />
        <StorageCard
          title="Documents"
          size={isLoadingStats ? "..." : formatBytes(stats?.document?.bytes || 0)}
          count={isLoadingStats ? "..." : `${stats?.document?.count || 0} files`}
          color="bg-orange-500"
          loading={isLoadingStats}
        />
      </div>

      {/* Total bar */}
      {stats && !isLoadingStats && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total Storage Used</span>
          <span className="text-lg font-bold">{formatBytes(stats.total.bytes)} <span className="text-zinc-500 text-sm font-normal">({stats.total.count} files)</span></span>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Media Types</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
            <option value="audio">Audio Only</option>
            <option value="document">Documents Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium">Uploaded</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoadingFiles ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Loading storage files...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No files found.</td></tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {file.category === 'image' && file.url ? (
                            <img src={file.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-zinc-500 uppercase">{file.category.substring(0,3)}</span>
                          )}
                        </div>
                        <span className="font-medium text-white truncate max-w-[200px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-300 capitalize">{file.category}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{formatBytes(file.size)}</td>
                    <td className="px-6 py-4 text-zinc-500">{file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            View
                          </a>
                        )}
                        <button
                          disabled={deletingId === file.id}
                          onClick={() => handleDelete(file)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === file.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StorageCard({ title, size, count, color, loading }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className="font-semibold text-zinc-400">{title}</h3>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse mb-1"></div>
      ) : (
        <div className="text-3xl font-bold tracking-tight text-white">{size}</div>
      )}
      {loading ? (
        <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mt-2"></div>
      ) : (
        <p className="text-sm text-zinc-500 mt-1">{count}</p>
      )}
    </div>
  );
}
