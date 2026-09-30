import 'server-only';
// Cloudflare Turnstile doğrulaması. TURNSTILE_SECRET_KEY yoksa (henüz kurulmadıysa) doğrulama atlanır.
export async function robotDegil(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: token, ...(ip && { remoteip: ip }) }),
    });
    return (await r.json()).success === true;
  } catch { return false; }
}
