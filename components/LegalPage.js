export default function LegalPage({ title, updated = '24 Eylül 2026', children }) {
  return (
    <article className="kap max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="soluk mt-2 text-sm">Son güncelleme: {updated}</p>
      <div className="yazi mt-6">{children}</div>
    </article>
  );
}
