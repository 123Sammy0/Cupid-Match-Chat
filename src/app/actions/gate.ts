"use server";

import { cookies } from "next/headers";

// Rate limiting (simple in-memory version for the prototype)
const rateLimitMap = new Map<string, { count: number; lockedUntil: number }>();

export async function verifyAccessCode(pin: string) {
  // Rate Limiting
  const ip = "global"; // Typically headers().get('x-forwarded-for')
  const record = rateLimitMap.get(ip) || { count: 0, lockedUntil: 0 };
  
  if (record.lockedUntil > Date.now()) {
    return { success: false, message: "Too many attempts. Try again later." };
  }

  // Hardcoded gate entry code as requested by admin
  if (pin === "1212") {
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
