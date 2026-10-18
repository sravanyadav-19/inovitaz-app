/**
 * MarkdownField — a labeled textarea with an Edit / Preview toggle,
 * for admin-authored Markdown fields (Overview, Circuit, Steps, Source).
 * Handlers use the native event shape, so existing
 * setFormData((prev) => ({ ...prev, field: e.target.value })) flows work.
 */
import { useState } from 'react';
import Markdown from '../Markdown';

export default function MarkdownField({ label, value, onChange, rows = 6, placeholder, id }) {
  const [mode, setMode] = useState('edit');
  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <label htmlFor={id} className="t-label text-outline">{label}</label>
        <div className="flex items-center gap-2">
          <span className="t-caption text-outline">Markdown supported — **bold**, `code`, lists, tables, - [ ] checklists</span>
          <div className="flex rounded-lg border border-surface-variant overflow-hidden" role="group" aria-label={`${label} mode`}>
            {['edit', 'preview'].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 px-3 text-xs font-semibold capitalize transition-colors ${
                  mode === m ? 'bg-primary/20 text-primary-dim' : 'text-outline hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      {mode === 'edit' ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-surface-high border border-surface-variant rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-primary-dim focus:outline-none"
        />
      ) : (
        <div
          className="w-full bg-surface-lowest border border-surface-variant rounded-xl px-4 py-3 text-sm min-h-[8rem]"
          aria-live="polite"
        >
          {value?.trim() ? <Markdown>{value}</Markdown> : <p className="text-outline italic">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
