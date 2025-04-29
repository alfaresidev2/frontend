import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value || '';

  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/signin' || 
                         pathname.startsWith('/_next') || 
                         pathname.startsWith('/images') || 
                         pathname.startsWith('/svg') ||
                         pathname === '/favicon.ico';

  // Skip middleware for public resources and API routes
  if (isPublicRoute || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // If not a public route and no token, redirect to signin
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Continue with the request for authenticated users
  return NextResponse.next();
}

// Configure which paths will use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images or svg folders
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|svg).*)',
  ],
}; 