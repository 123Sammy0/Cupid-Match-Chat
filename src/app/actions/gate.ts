"use server";

import { cookies } from "next/headers";

export async function verifyAccessCode(pin: string) {
  const gateCode = process.env.GATEWAY_PASSWORD || "1212";
  if (pin === gateCode) {
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('gate_passed', 'true', { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 });
    return { success: true };
  } else {
    return { success: false, message: "Incorrect code" };
  }
}
