import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Countries to block (ISO 3166-1 alpha-2 codes)
const BLOCKED_COUNTRIES = ['UA', 'RU', 'CN', 'KP', 'IR'];

export function middleware(request: NextRequest) {
  // Only run geolocation check in production (Vercel)
  // In local dev, skip this check to avoid requiring @vercel/edge package
  if (process.env.VERCEL === '1') {
    try {
      // Dynamically import geolocation only on Vercel
      // This prevents build errors in local development
      const country = request.headers.get('x-vercel-ip-country');

      // If country is blocked, return 403
      if (country && BLOCKED_COUNTRIES.includes(country)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Access Denied',
            message: 'Access from your country is not allowed.'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      // If geolocation fails, allow request to proceed
      console.error('Geolocation check failed:', error);
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
