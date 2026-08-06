import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false }, { status: 400 });
    
    const adminSupabase = createAdminClient();
    await adminSupabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
