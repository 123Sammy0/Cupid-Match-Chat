import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Check if trying to access private routes without passing the gate
  const gatePassed = request.cookies.get('gate_passed')?.value
  const isGateRoute = request.nextUrl.pathname === '/gate'
  const isPublicRoute = request.nextUrl.pathname === '/'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isRoomRoute = request.nextUrl.pathname.startsWith('/room')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // If accessing auth, room, or admin but hasn't passed gate -> redirect to gate
  if (!gatePassed && (isAuthRoute || isRoomRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL('/gate', request.url))
  }

  // 2. Refresh Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Protect routes based on authentication
  if (!user && (isRoomRoute || isAdminRoute)) {
    // Need to be logged in to access room or admin
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (user && isAuthRoute) {
    // Already logged in, redirect to room selection
    return NextResponse.redirect(new URL('/room', request.url))
  }

  // 4. Admin route protection
  if (user && isAdminRoute) {
    const { data: profile } = await supabase.from('profiles').select('role, active').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin' || !profile.active) {
      return NextResponse.redirect(new URL('/room', request.url))
    }
  }

  return response
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
}
