'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const TURLER = { atolye: 'Atölyeden fotoğraflar', instagram: 'Instagram gönderileri' };

export default function Page() {
  const supabase = createClient();
  const [tur, setTur] = useState('atolye');
  const [list, setList] = useState([]);
  const [link, setLink] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = async () => setList((await supabase.from('gallery_items').select('*').order('sort').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);

  async function yukle(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setBusy(true); setErr('');
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { setErr(`${file.name} 5 MB'tan büyük`); continue; }
      const path = `galeri/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split('.').pop().toLowerCase()}`;
      const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file, { cacheControl: '31536000' });
      if (error) { setErr('Yükleme başarısız'); continue; }
      const image_url = supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl;
      await supabase.from('gallery_items').insert({ kind: tur, image_url, link: tur === 'instagram' ? link || null : null, caption: caption || null, sort: list.length });
    }
    setBusy(false); setLink(''); setCaption(''); e.target.value = ''; load();
  }
  async function sil(g) { if (confirm('Görsel kaldırılsın mı?')) { await supabase.from('gallery_items').delete().eq('id', g.id); load(); } }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Galeri</h1>
      <p className="soluk -mt-4 text-sm">Buraya eklediğiniz görseller ana sayfadaki "Perde arkası" ve "Instagram" bölümlerinde görünür. Bölüm boşsa ana sayfada gizlenir.</p>
      <div className="kutu space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {Object.entries(TURLER).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setTur(k)} className={tur === k ? 'btn-ana' : 'btn-cizgi'}>{v}</button>
          ))}
        </div>
        {tur === 'instagram' && (
          <div><label className="etiket" htmlFor="l">Gönderi bağlantısı (isteğe bağlı)</label><input id="l" className="girdi" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.instagram.com/p/..." /></div>
        )}
        <div><label className="etiket" htmlFor="c">Kısa açıklama (isteğe bağlı)</label><input id="c" className="girdi" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Örnek: Yeni figür serisi baskıda" /></div>
        <input type="file" accept="image/*" multiple onChange={yukle} disabled={busy} className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lacivert-800 file:px-4 file:py-2 file:font-semibold file:text-white" />
        <p className="soluk text-xs">{busy ? 'Yükleniyor…' : 'Birden fazla görsel seçebilirsiniz. Instagram için gönderinin ekran görüntüsünü veya fotoğrafını yükleyin.'}</p>
        {err && <p className="hata">{err}</p>}
      </div>
      {Object.entries(TURLER).map(([k, v]) => (
        <section key={k}>
          <h2 className="mb-3 font-sans font-semibold">{v}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {list.filter((g) => g.kind === k).map((g) => (
              <div key={g.id} className="group relative aspect-square overflow-hidden rounded-xl bg-krem">
                <img src={g.image_url} alt="" className="h-full w-full object-cover" />
                <button onClick={() => sil(g)} className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-600 shadow">Kaldır</button>
              </div>
            ))}
            {!list.some((g) => g.kind === k) && <p className="soluk col-span-full text-sm">Henüz görsel yok.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
