import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';


export async function GET(req: Request) {
  // Optional: Verify Vercel cron auth header
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Delete expired messages
    const { data: deletedMsgs, error: msgsError } = await supabase
      .from('messages')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (msgsError) throw msgsError;

    // Delete expired attachments
    const { data: deletedAtts, error: attsError } = await supabase
      .from('attachments')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (attsError) throw attsError;

    // Log the cleanup run
    await supabase.from('cleanup_runs').insert({
      status: 'success',
      finished_at: now,
      deleted_messages: deletedMsgs?.length || 0,
      deleted_attachments: deletedAtts?.length || 0,
    });

    return NextResponse.json({
      success: true,
      deleted_messages: deletedMsgs?.length || 0,
      deleted_attachments: deletedAtts?.length || 0
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    
    // Log failure
    const supabase = createAdminClient();
    await supabase.from('cleanup_runs').insert({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_summary: error.message
    });

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
