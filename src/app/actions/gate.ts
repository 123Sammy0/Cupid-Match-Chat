"use server";

import { cookies } from "next/headers";

export async function verifyAccessCode(pin: string) {
  // Hardcoded gate entry code as requested by admin
  if (pin === "1212") {
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('gate_passed', 'true', { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 });
    return { success: true };
  } else {
    return { success: false, message: "Incorrect code" };
  }
}
