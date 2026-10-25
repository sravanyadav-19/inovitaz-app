/**
 * EmailUs — replaces raw `mailto:` links (they force-open the OS default
 * mail app — Outlook on most Windows machines — and lose the enquiry).
 * Click opens a small menu giving every user a door that works:
 *   Gmail compose (browser tab) · Copy address (universal) ·
 *   Outlook web compose · Classic mailto (for desktop-app people).
 */
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiMail, HiOutlineClipboardCopy, HiOutlineExternalLink } from 'react-icons/hi';

const ADDRESS = 'support@inovitaz.in';

export default function EmailUs({ label = 'Email us', subject = '', className = '', block = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const su = encodeURIComponent(subject);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${ADDRESS}&su=${su}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${ADDRESS}&subject=${su}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS);
      toast.success('Email address copied');
    } catch {
      toast.error(ADDRESS);
    }
    setOpen(false);
  };

  const itemCls =
    'w-full flex items-center gap-3 px-4 py-2.5 min-h-11 text-sm text-left text-icon-soft hover:bg-surface-high hover:text-white transition-colors';

  return (
    <div ref={ref} className={`relative ${block ? 'block' : 'inline-block'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={className || 'btn btn-primary inline-flex items-center gap-2 min-h-11'}
      >
        <HiMail aria-hidden="true" className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose how to email us"
          className="absolute z-50 mt-2 w-72 rounded-xl bg-surface-high border border-surface-variant shadow-xl overflow-hidden animate-fade-in"
        >
          <p className="px-4 pt-3 pb-2 text-xs text-outline">
            Pick your mailbox — no forced app-switch:
          </p>
          <a role="menuitem" href={gmailUrl} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
            <HiOutlineExternalLink className="w-4 h-4 text-primary-dim" aria-hidden="true" />
            Open compose in <b className="text-white">Gmail</b>
          </a>
          <a role="menuitem" href={outlookUrl} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
            <HiOutlineExternalLink className="w-4 h-4 text-info-fg" aria-hidden="true" />
            Open compose in <b className="text-white">Outlook web</b>
          </a>
          <button role="menuitem" type="button" onClick={copyAddress} className={itemCls}>
            <HiOutlineClipboardCopy className="w-4 h-4 text-success-fg" aria-hidden="true" />
            Copy the address <b className="text-white">({ADDRESS})</b>
          </button>
          <a role="menuitem" href={`mailto:${ADDRESS}?subject=${su}`} className={`${itemCls} border-t border-surface-variant`} onClick={() => setOpen(false)}>
            <HiMail className="w-4 h-4 text-outline" aria-hidden="true" />
            My configured mail app
          </a>
        </div>
      )}
    </div>
  );
}
