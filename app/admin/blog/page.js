'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/format';
import { markdown } from '@/lib/markdown';
import { gorselKucult } from '@/lib/gorsel';

const BOS = { title: '', slug: '', excerpt: '', content: '', cover: '', is_published: false };

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [f, setF] = useState(null);
  const [onizle, setOnizle] = useState(false);
  const [msg, setMsg] = useState('');
  const load = async () => setList((await supabase.from('posts').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function kapak(e) {
    const ham = e.target.files?.[0]; if (!ham) return; const file = await gorselKucult(ham);
    const path = `blog/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file);
    if (!error) setF((p) => ({ ...p, cover: supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl }));
  }
  async function gorselEkle(e) {
    const ham = e.target.files?.[0]; if (!ham) return; const file = await gorselKucult(ham);
    const path = `blog/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file);
    if (!error) setF((p) => ({ ...p, content: `${p.content}\n\n![](${supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl})\n` }));
    e.target.value = '';
  }
  async function kaydet() {
    if (!f.title.trim() || !f.content.trim()) return setMsg('Başlık ve içerik gerekli.');
    const row = { title: f.title.trim(), slug: f.slug.trim() || slugify(f.title), excerpt: f.excerpt, content: f.content, cover: f.cover || null, is_published: f.is_published, updated_at: new Date().toISOString(),
      published_at: f.is_published ? f.published_at || new Date().toISOString() : f.published_at || null };
    const { error } = f.id ? await supabase.from('posts').update(row).eq('id', f.id) : await supabase.from('posts').insert(row);
    if (error) return setMsg(error.message.includes('slug') ? 'Bu bağlantı adı başka bir yazıda kullanılıyor.' : error.message);
    setF(null); setMsg(''); load();
  }
  async function sil(y) { if (confirm(`"${y.title}" silinsin mi?`)) { await supabase.from('posts').delete().eq('id', y.id); load(); } }

  if (f) return (
    <div className="space-y-4">
      <button onClick={() => setF(null)} className="soluk text-sm hover:underline">← Yazılar</button>
      <h1 className="text-3xl font-semibold">{f.id ? 'Yazıyı düzenle' : 'Yeni yazı'}</h1>
      <input className="girdi text-lg font-semibold" value={f.title} onChange={set('title')} placeholder="Başlık" aria-label="Başlık" />
      <input className="girdi" value={f.slug} onChange={set('slug')} placeholder={`Bağlantı: /blog/${slugify(f.title || 'yazi-basligi')}`} aria-label="Bağlantı adı" />
      <textarea className="girdi" rows={2} value={f.excerpt} onChange={set('excerpt')} placeholder="Kısa özet (listede ve Google'da görünür)" aria-label="Özet" />
      <div className="flex flex-wrap items-center gap-3">
        {f.cover && <img src={f.cover} alt="" className="h-16 w-28 rounded-lg object-cover" />}
        <label className="btn-cizgi cursor-pointer py-2">Kapak görseli<input type="file" accept="image/*" onChange={kapak} className="sr-only" /></label>
        <label className="btn-cizgi cursor-pointer py-2">Metne görsel ekle<input type="file" accept="image/*" onChange={gorselEkle} className="sr-only" /></label>
        <button type="button" onClick={() => setOnizle(!onizle)} className="btn-cizgi py-2">{onizle ? 'Düzenle' : 'Önizle'}</button>
      </div>
      {onizle ? <div className="blog-yazi kutu p-6" dangerouslySetInnerHTML={{ __html: markdown(f.content) }} /> : (
        <textarea className="girdi font-mono text-sm" rows={18} value={f.content} onChange={set('content')} aria-label="İçerik"
          placeholder={'## Ara başlık\n\nParagraf metni. **kalın**, *italik*, [bağlantı](https://...)\n\n- madde\n- madde\n\n> alıntı'} />
      )}
      <p className="soluk text-xs">Yazım: ## ara başlık · **kalın** · *italik* · [metin](bağlantı) · - liste · &gt; alıntı. Boş satır yeni paragraf başlatır.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_published} onChange={set('is_published')} className="accent-nozul-500" /> Yayında</label>
      {msg && <p className="hata">{msg}</p>}
      <button onClick={kaydet} className="btn-ana">Kaydet</button>
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">Blog</h1><button onClick={() => setF({ ...BOS })} className="btn-ana">Yeni yazı</button></div>
      <ul className="space-y-2">
        {list.map((y) => (
          <li key={y.id} className="kutu flex flex-wrap items-center gap-3 p-4 text-sm">
            <b className="flex-1">{y.title}</b>
            <span className={y.is_published ? 'text-emerald-600' : 'soluk'}>{y.is_published ? 'Yayında' : 'Taslak'}</span>
            {y.is_published && <a href={`/blog/${y.slug}`} target="_blank" className="underline">Gör</a>}
            <button onClick={() => setF({ ...y, excerpt: y.excerpt || '', cover: y.cover || '' })} className="underline">Düzenle</button>
            <button onClick={() => sil(y)} className="text-red-600 underline">Sil</button>
          </li>
        ))}
        {!list.length && <li className="kutu soluk p-6 text-center">Henüz yazı yok. İlk yazınız için öneri: "PLA mı PETG mi? Hangi malzeme ne işe yarar"</li>}
      </ul>
    </div>
  );
}
