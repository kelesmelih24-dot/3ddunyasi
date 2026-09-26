export default function Loading() {
  return (
    <div className="kap grid min-h-[50vh] place-items-center" role="status" aria-label="Yükleniyor">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 items-end gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="w-2 rounded-full bg-nozul-500" style={{ height: '100%', animation: `yukleniyor 1s ease-in-out ${i * 0.12}s infinite` }} />
          ))}
        </div>
        <span className="soluk text-sm">Katmanlar yükleniyor…</span>
      </div>
      <style>{`@keyframes yukleniyor{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}`}</style>
    </div>
  );
}
