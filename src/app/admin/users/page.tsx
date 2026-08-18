"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, updateUserRole, updateUserStatus } from "@/app/actions/admin";

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals / Actions
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;
    setProcessingId(userId);
    try {
      await updateUserRole(userId, newRole);
      await loadUsers(); // Refresh
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    if (!confirm(`Are you sure you want to change this user status to ${newStatus}?`)) return;
    setProcessingId(userId);
    try {
      await updateUserStatus(userId, newStatus);
      await loadUsers(); // Refresh
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter
  const filteredUsers = users.filter(u => 
    (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-zinc-400 mt-1">Manage accounts, roles, and access controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadUsers}
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by username or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-white placeholder-zinc-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  let statusStr = "active";
                  if (user.deleted_at) statusStr = "banned";
                  else if (user.is_suspended) statusStr = "suspended";

                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                            {user.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{user.username || "Unknown"}</span>
                            <span className="text-xs text-zinc-500">{user.username ? `${user.username}@cupid.com` : ''}</span>
                            <span className="text-xs text-zinc-600 mt-0.5">ID: {user.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={processingId === user.id}
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium focus:outline-none appearance-none cursor-pointer
                            ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}
                          `}
                        >
                          <option value="user">User</option>
                          <option value="partner">Partner</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={processingId === user.id}
                          value={statusStr}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as any)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize focus:outline-none appearance-none cursor-pointer border
                            ${statusStr === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                            ${statusStr === 'suspended' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                            ${statusStr === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                          `}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-zinc-500 mr-4">{user.messagesCount} msgs</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
