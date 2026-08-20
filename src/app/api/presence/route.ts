import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Presence API — Heartbeat/Lease Model
 *
 * Actions:
 *   heartbeat — update last_seen + set presence_status to 'online'
 *   connect   — set presence_status to 'online', set connection_id
 *   disconnect — set presence_status to 'offline', clear connection_id
 *
 * The client calls this endpoint:
 *   - On connect: action='connect'
 *   - Every 30s: action='heartbeat'
 *   - On page hide / unload: action='disconnect' (with keepalive)
 *
 * Lease expiry: If a client's last_seen is > 90s old and presence_status
 * is still 'online', the server treats them as offline. This is enforced
 * by consumers (queries), not by a background job.
 */
export async function POST(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    // Parse the action from the request body
    let action: string = 'heartbeat';
    let connectionId: string | null = null;
    try {
      const body = await req.json();
      if (body.action) action = body.action;
      if (body.connectionId) connectionId = body.connectionId;
    } catch {
      // If body parsing fails, default to heartbeat (backward compat)
    }

    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    switch (action) {
      case 'connect': {
        const connId = connectionId || crypto.randomUUID();
        await adminSupabase.from('profiles').update({
          last_seen: now,
          presence_status: 'online',
          connection_id: connId,
        }).eq('id', user.id);
        return NextResponse.json({ success: true, connectionId: connId });
      }

      case 'disconnect': {
        await adminSupabase.from('profiles').update({
          last_seen: now,
          presence_status: 'offline',
          connection_id: null,
        }).eq('id', user.id);
        return NextResponse.json({ success: true });
      }

      case 'heartbeat':
      default: {
        await adminSupabase.from('profiles').update({
          last_seen: now,
          presence_status: 'online',
        }).eq('id', user.id);
        return NextResponse.json({ success: true });
      }
    }
  } catch (error) {
    console.error('[Presence API] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
