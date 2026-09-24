import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const KORUNAN = ['/hesabim', '/odeme', '/admin'];

export async function updateSession(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && KORUNAN.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/giris';
    url.searchParams.set('sonra', path);
    return NextResponse.redirect(url);
  }
  return response;
}
