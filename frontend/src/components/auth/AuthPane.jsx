/**
 * AuthPane — the shared brand panel for split-screen auth pages (Login /
 * Signup). Pure CSS atmosphere so it always renders (F8: external stock
 * imagery was hotlinked from Unsplash and broke offline/sandbox preview).
 * Copy is intentionally scent-first, not jargon (navigation-patterns).
 */
export default function AuthPane({
  eyebrow,
  title,
  subtitle,
  footnote,
  image = '/auth-pane.jpg',   // local asset (repo-bundled — offline-safe, unlike the old Unsplash hotlink)
}) {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center border-l border-white/5">
      {/* Brand imagery (user-requested) — kept whisper-quiet under a scrim
          so the type stays the hierarchy */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest via-surface-lowest/80 to-surface-lowest/50 pointer-events-none" />
      <div className="absolute inset-0 bg-hacker-grid bg-[size:40px_40px] opacity-[0.06] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center px-8 max-w-md enter">
        {eyebrow && <div className="t-label text-primary-dim mb-4">{eyebrow}</div>}
        <h2 className="t-h2 text-white mb-4">{title}</h2>
        {subtitle && <p className="text-outline text-lg">{subtitle}</p>}
        {footnote && (
          <p className="t-num mt-8 text-xs text-outline/70 uppercase tracking-[0.2em]">
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}
