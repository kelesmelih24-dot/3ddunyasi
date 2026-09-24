export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/logo.svg" alt="" width="32" height="32" className="h-8 w-8" />
      <span className="font-display text-xl font-bold tracking-tight">
        3d<span className="font-medium">dünyası</span>
      </span>
    </span>
  );
}
