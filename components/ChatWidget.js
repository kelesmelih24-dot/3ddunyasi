'use client';
import { useEffect, useRef, useState } from 'react';
import { markdown } from '@/lib/markdown';

const ORNEKLER = ['İsimli anahtarlık kaç günde gelir?', 'PLA mı PETG mi daha dayanıklı?', 'Kendi modelimi bastırabilir miyim?'];

export default function ChatWidget() {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState([]);
  const [yazi, setYazi] = useState('');
  const [bekle, setBekle] = useState(false);
  const alt = useRef(null);
  useEffect(() => { alt.current?.scrollIntoView({ behavior: 'smooth' }); }, [mesajlar, bekle]);

  async function gonder(metin) {
    const soru = (metin ?? yazi).trim();
    if (!soru || bekle) return;
    const yeni = [...mesajlar, { role: 'user', content: soru }];
    setMesajlar(yeni); setYazi(''); setBekle(true);
    try {
      const r = await fetch('/api/asistan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: yeni }) });
      const d = await r.json();
      setMesajlar([...yeni, { role: 'assistant', content: d.text || d.error || 'Bir sorun oluştu.' }]);
    } catch { setMesajlar([...yeni, { role: 'assistant', content: 'Bağlantı sorunu oluştu, tekrar dener misiniz?' }]); }
    setBekle(false);
  }

  return (
    <>
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} aria-label={acik ? 'Asistanı kapat' : 'Yapay zekâ asistanına sor'}
        className="fixed bottom-[5.5rem] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-nozul-500 text-white shadow-lg transition-transform hover:scale-105">
        {acik ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /><path d="M9 10h.01M12 10h.01M15 10h.01" strokeLinecap="round" strokeWidth="3" /></svg>}
      </button>
      {acik && (
        <div role="dialog" aria-label="3D Dünyası asistanı" className="kutu fixed bottom-40 right-3 z-50 flex h-[min(560px,70vh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden shadow-2xl sm:right-5">
          <div className="bg-lacivert-800 px-4 py-3 text-white">
            <p className="font-display font-semibold">3D Dünyası asistanı</p>
            <p className="text-xs text-white/70">Ürünler, kargo ve özel sipariş hakkında sorun</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {!mesajlar.length && (
              <div className="space-y-2">
                <p className="soluk">Merhaba! Size nasıl yardımcı olabilirim?</p>
                {ORNEKLER.map((o) => <button key={o} onClick={() => gonder(o)} className="block w-full rounded-xl border border-lacivert-100 px-3 py-2 text-left hover:border-nozul-500 dark:border-lacivert-800">{o}</button>)}
              </div>
            )}
            {mesajlar.map((m, i) => m.role === 'user'
              ? <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-nozul-500 px-3.5 py-2 text-white">{m.content}</p>
              : <div key={i} className="blog-yazi max-w-[90%] rounded-2xl rounded-bl-sm bg-krem px-3.5 py-2 text-sm leading-6 dark:bg-lacivert-800 [&_p]:mb-2 [&_p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: markdown(m.content) }} />)}
            {bekle && <p className="soluk">Yazıyor…</p>}
            <div ref={alt} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); gonder(); }} className="border-t border-lacivert-100 p-3 dark:border-lacivert-800">
            <div className="flex gap-2">
              <input value={yazi} onChange={(e) => setYazi(e.target.value)} maxLength={500} placeholder="Sorunuzu yazın" aria-label="Sorunuz" className="girdi rounded-full py-2" />
              <button disabled={bekle || !yazi.trim()} className="btn-ana shrink-0 px-4" aria-label="Gönder">➤</button>
            </div>
            <p className="soluk mt-1.5 text-[10px]">Yapay zekâ yanıtları hatalı olabilir. Sipariş ve ödeme konularında WhatsApp'tan bize ulaşın.</p>
          </form>
        </div>
      )}
    </>
  );
}
