import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const sonra = searchParams.get('sonra') || '/';
  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${sonra.startsWith('/') ? sonra : '/'}`);
  }
  return NextResponse.redirect(`${origin}/giris?hata=1`);
}
