/**
 * CategoryTiles — the Home sidebar content tiles: "Every kit includes"
 * checklist + testimonial figures. Extracted per UX-AUDIT Phase 2 so the
 * page-level JSX stays at composition level (one component = one tile idea).
 */

// TODO: replace quotes with real customer testimonials before public launch.
const QUOTES = [
  {
    text: 'The source code and diagrams were so complete I had my weather station running in one afternoon.',
    attribution: 'Engineering student, Andhra Pradesh',
  },
  {
    text: 'Support replied on WhatsApp within the hour and helped me fix a wiring mistake.',
    attribution: 'Maker & hobbyist',
  },
];

const KIT_ITEMS = [
  'Complete source code',
  'Circuit diagram',
  'Component list',
  'Setup guide (PDF)',
  'Lifetime downloads',
];

export default function CategoryTiles({ checklistIcon: CheckIcon }) {
  return (
    <>
      <div className="rounded-xl border border-surface-variant bg-surface p-5">
        <p className="t-sm font-semibold text-white mb-3">Every kit includes</p>
        <ul className="space-y-2 text-sm text-outline">
          {KIT_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2">
              {CheckIcon && <CheckIcon className="w-4 h-4 text-success-fg" aria-hidden="true" />}
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {QUOTES.map((quote) => (
          <figure
            key={quote.text}
            className="rounded-xl border border-surface-variant bg-surface p-5"
          >
            <blockquote className="text-sm text-outline leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs text-primary-fixed font-medium">
              — {quote.attribution}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
