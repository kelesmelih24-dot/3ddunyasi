import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|logo.svg|apple-icon.png|og.png|imlec|ornek|panel|video|sitemap.xml|robots.txt|api/iyzico).*)'],
};
