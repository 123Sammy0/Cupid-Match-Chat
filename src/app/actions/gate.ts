"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Rate limiting (simple in-memory version for the prototype - in prod use Redis/Vercel KV or DB table)
const rateLimitMap = new Map<string, { count: number; lockedUntil: number }>();

export async function verifyAccessCode(pin: string) {
  // Rate Limiting
  const ip = "global"; // Typically headers().get('x-forwarded-for')
  const record = rateLimitMap.get(ip) || { count: 0, lockedUntil: 0 };
  
  if (record.lockedUntil > Date.now()) {
    return { success: false, message: "Too many attempts. Try again later." };
  }

  const supabase = createAdminClient();
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value_encrypted')
    .eq('key', 'access_code_verifier')
    .single();

  const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

  // If no code exists yet, this is the very first time! We set it.
  if (!setting) {
    await supabase.from('app_settings').insert({
      key: 'access_code_verifier',
      value_encrypted: hashedPin
    });
    
    // Set cookie to indicate gate passed
    const cookieStore = await cookies();
    cookieStore.set('gate_passed', 'true', { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 });
    return { success: true };
  }

  // Validate against existing hash
  if (setting.value_encrypted === hashedPin) {
    // Reset rate limit
    rateLimitMap.delete(ip);
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('gate_passed', 'true', { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 });
    return { success: true };
  } else {
    // Increment rate limit
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    }
    rateLimitMap.set(ip, record);
    return { success: false, message: "Incorrect code" };
  }
}
