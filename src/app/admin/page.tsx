import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { lockAccountAction } from "@/app/actions/admin";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile || profile.role !== 'admin' || !profile.active) {
    redirect("/room");
  }

  // Fetch all users
  const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  
  // Fetch audit logs
  const { data: auditLogs } = await supabase.from('admin_audit').select('*').order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen w-full bg-white p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl p-8 rounded-2xl border border-gray-100">
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage access and review activity</p>
          </div>
          <a href="/room" className="btn btn-ghost px-4 py-2 border rounded hover:bg-gray-50">Back to Rooms</a>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">User Accounts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Login</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allProfiles?.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3 font-medium">{p.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${p.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {p.last_login_at ? new Date(p.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3 text-right">
                      {p.role !== 'admin' && (
                        <form action={async () => {
                          "use server";
                          await lockAccountAction(p.id, !p.active);
                        }}>
                          <button type="submit" className={`text-xs px-3 py-1 rounded border ${p.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                            {p.active ? 'Lock Account' : 'Unlock'}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
          <div className="bg-gray-50 border rounded-lg p-4 overflow-y-auto max-h-64">
            {auditLogs && auditLogs.length > 0 ? (
              <ul className="space-y-3">
                {auditLogs.map(log => (
                  <li key={log.id} className="text-sm">
                    <span className="text-gray-400">[{new Date(log.created_at).toLocaleString()}]</span>{' '}
                    <span className="font-semibold">{log.action}</span> - {log.target_type} ({log.target_id})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No audit logs found.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
