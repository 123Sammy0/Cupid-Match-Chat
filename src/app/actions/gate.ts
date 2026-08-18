"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export async function verifyAccessCode(pin: string) {
  const adminSupabase = createAdminClient();
  const { data: flag } = await adminSupabase.from("feature_flags").select("value").eq("key", "gate_password").single();
  
  let gateCode = process.env.GATEWAY_PASSWORD || "1212";
  if (flag && flag.value && typeof flag.value.password === 'string') {
    gateCode = flag.value.password;
  }

  if (pin === gateCode) {
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('gate_passed', 'true', { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 });
    return { success: true };
  } else {
    return { success: false, message: "Incorrect code" };
  }
}
