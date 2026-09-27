// Basit ve güvenli Markdown → HTML (başlık, kalın, italik, link, görsel, liste, alıntı, paragraf)
const kacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const guvenliUrl = (u) => (/^(https?:\/\/|\/)/i.test(u) ? u : '#');
function satirIci(s) {
  return kacis(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img src="${guvenliUrl(u)}" alt="${a}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${guvenliUrl(u)}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}
export function markdown(md = '') {
  const cikti = []; let liste = null; let paragraf = [];
  const bitir = () => { if (paragraf.length) { cikti.push(`<p>${satirIci(paragraf.join(' '))}</p>`); paragraf = []; } if (liste) { cikti.push(`<${liste.tur}>${liste.ogeler.map((o) => `<li>${satirIci(o)}</li>`).join('')}</${liste.tur}>`); liste = null; } };
  for (const ham of md.replace(/\r/g, '').split('\n')) {
    const s = ham.trim();
    let m;
    if (!s) { bitir(); continue; }
    if ((m = s.match(/^(#{1,3})\s+(.*)/))) { bitir(); const n = Math.min(3, Math.max(2, m[1].length)); cikti.push(`<h${n}>${satirIci(m[2])}</h${n}>`); continue; }
    if ((m = s.match(/^[-*]\s+(.*)/)) || (m = s.match(/^\d+[.)]\s+(.*)/))) {
      const tur = /^\d/.test(s) ? 'ol' : 'ul';
      if (paragraf.length) { cikti.push(`<p>${satirIci(paragraf.join(' '))}</p>`); paragraf = []; }
      if (liste && liste.tur !== tur) bitir();
      (liste ??= { tur, ogeler: [] }).ogeler.push(m[1]); continue;
    }
    if ((m = s.match(/^>\s?(.*)/))) { bitir(); cikti.push(`<blockquote>${satirIci(m[1])}</blockquote>`); continue; }
    if (liste) bitir();
    paragraf.push(s);
  }
  bitir();
  return cikti.join('\n');
}
