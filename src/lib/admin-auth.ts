import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const verifyAdmin = async () => {
  const cookieStore = await cookies();
  
  // We use createAdminClient (which uses service_role) to check the profile,
  // but first we need the user's session from the normal client.
  // To avoid Next.js 15 cookies() errors, we simply read the cookie to get the auth token,
  // or use the server client.
  const { createServerClient } = require("@supabase/ssr");
  
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
  if (!user) redirect("/admin-login");

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return user;
};
