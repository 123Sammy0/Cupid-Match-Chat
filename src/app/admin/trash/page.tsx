"use client";

import { useEffect, useState } from "react";
import { getDeletedUsers, restoreUser, permanentlyDeleteUser } from "@/app/actions/admin";

export default function TrashRecoveryPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const tabs = [
    { id: "users", label: "Users" },
    { id: "chats", label: "Chats & Messages" },
    { id: "media", label: "Media" },
  ];

  const loadDeletedUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getDeletedUsers();
      setDeletedUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedUsers();
  }, []);

  const handleRestore = async (userId: string, username: string) => {
    if (!confirm(`Restore user "${username}"? They will be unbanned in Supabase Auth and their profile will be reactivated.`)) return;
    setProcessingId(userId);
    try {
      await restoreUser(userId);
      await loadDeletedUsers();
    } catch (e: any) {
      alert(`Failed to restore: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (userId: string, username: string) => {
    if (!confirm(`PERMANENTLY delete "${username}"? This will remove all profile data and the auth account. This CANNOT be undone.`)) return;
    setProcessingId(userId);
    try {
      await permanentlyDeleteUser(userId);
      await loadDeletedUsers();
    } catch (e: any) {
      alert(`Failed to permanently delete: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trash & Recovery</h1>
          <p className="text-zinc-400 mt-1">Review, restore, or permanently delete soft-deleted items.</p>
        </div>
        <button
          onClick={loadDeletedUsers}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {tab.id === "users" && deletedUsers.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">{deletedUsers.length}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === "users" ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 animate-pulse">Loading deleted users...</div>
          ) : deletedUsers.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No deleted users found</h3>
              <p className="text-sm text-zinc-400 max-w-md">
                Users deleted by Admins will appear here. You can restore or permanently purge them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Deleted At</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {deletedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center font-bold text-red-400 flex-shrink-0">
                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-300 line-through decoration-red-500/50">{user.username || "Unknown"}</span>
                            <span className="text-xs text-zinc-600 mt-0.5">ID: {user.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {user.deleted_at ? new Date(user.deleted_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-medium">
                          Deleted
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processingId === user.id}
                            onClick={() => handleRestore(user.id, user.username)}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {processingId === user.id ? "..." : "Restore"}
                          </button>
                          <button
                            disabled={processingId === user.id}
                            onClick={() => handlePermanentDelete(user.id, user.username)}
                            className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {processingId === user.id ? "..." : "Purge"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 capitalize">No deleted {activeTab} found</h3>
          <p className="text-sm text-zinc-400 max-w-md">
            Soft-deleted {activeTab} are managed at the database level. Only user recovery is currently supported through this interface.
          </p>
        </div>
      )}
    </div>
  );
}
