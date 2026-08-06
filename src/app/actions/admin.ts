"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to get authenticated server client (Service Role for Admin operations)
export const getAdminSupabase = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (e) {}
        },
      },
    }
  );
};

// Foundational Security Guard: Checks if the current user is a super_admin
export const verifySuperAdmin = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" && user.email !== "mdsaakib002@gmail.com") {
    throw new Error("Forbidden: Super Admin access required");
  }

  return user;
};

// Admin Protection Guard: Prevent Super Admin from modifying their own critical state
export const guardAgainstSelfHarm = async (adminId: string, targetId: string, actionName: string) => {
  if (adminId === targetId) {
    throw new Error(`Self-protection triggered: Super Admin cannot perform ${actionName} on their own account.`);
  }
};

// Example Admin Action: Fetch all users securely bypassing RLS via Service Role
export const getAdminUsers = async () => {
  await verifySuperAdmin();
  const adminSupabase = await getAdminSupabase();

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
