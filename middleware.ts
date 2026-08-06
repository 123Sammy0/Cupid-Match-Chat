import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Route Protection Logic
  const path = req.nextUrl.pathname;

  // Admin Routes Protection
  if (path.startsWith('/admin')) {
    if (!user) {
      // Not logged in -> redirect to standard auth if not already on admin login
      if (path !== '/admin/login') {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    } else {
      // Check admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'mdsaakib002@gmail.com';

      if (!isSuperAdmin) {
        // Logged in but not an admin -> redirect to standard home
        if (path !== '/admin/login') {
          return NextResponse.redirect(new URL('/', req.url));
        }
      } else {
        // Is admin, trying to access login -> redirect to admin dashboard
        if (path === '/admin/login') {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }
    }
  }

  // General App Protection (optional, depending on existing rules)
  // Currently skipping general app protection in middleware to avoid breaking existing SSR flows,
  // focusing strictly on /admin routes as requested in Phase 1.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
