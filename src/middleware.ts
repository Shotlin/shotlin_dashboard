import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decode a JWT payload without crypto verification.
 * We only need to check the `exp` claim client-side — the backend
 * performs full cryptographic verification on every API call.
 */
function decodeJwtPayload(token: string): { exp?: number; id?: string } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        return payload;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    // ─── Protect /dashboard routes ───
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Verify JWT structure and expiry
        const payload = decodeJwtPayload(token);
        if (!payload || !payload.exp) {
            // Malformed token — clear it and redirect
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('token');
            return response;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        if (payload.exp < nowSeconds) {
            // Expired token — clear it and redirect
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('token');
            return response;
        }
    }

    // ─── Redirect / to /dashboard if already logged in ───
    if (request.nextUrl.pathname === '/') {
        if (token) {
            const payload = decodeJwtPayload(token);
            // Only redirect if token is valid and not expired
            if (payload?.exp && payload.exp > Math.floor(Date.now() / 1000)) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // Expired or invalid — clear the stale cookie
            const response = NextResponse.next();
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/dashboard/:path*'],
};
