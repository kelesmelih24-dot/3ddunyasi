import 'server-only';

// Yöneticiye Telegram bildirimi. TELEGRAM_BOT_TOKEN ve TELEGRAM_CHAT_ID yoksa sessizce atlanır.
export async function telegram(metin) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: metin, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (e) { console.error('Telegram gönderilemedi', e); }
}

export const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
