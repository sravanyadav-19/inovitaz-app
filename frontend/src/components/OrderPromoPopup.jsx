import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HiX, HiChip } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { isOrderHost, orderSiteUrl } from '../utils/host';

const SESSION_KEY = 'orderPromoShown';
const DELAY_MS = 8000; // 8 seconds on the catalog page

/**
 * One-per-session promo for the build service (order.inovitaz.in).
 *
 * Trigger (confirmed): fires once per browser session after the visitor has
 * spent 8 seconds on the Projects catalog page (/projects) — not on first
 * paint, not on every route change.
 *
 * Visibility rule: logged-out visitors and logged-in customers (role 'user')
 * see it; admins never do. It is also suppressed on order.inovitaz.in itself
 * (no point advertising the site the visitor is already on).
 */
const OrderPromoPopup = () => {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAdmin || isOrderHost()) return undefined;
    if (sessionStorage.getItem(SESSION_KEY)) return undefined;
    if (pathname !== '/projects') return undefined;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1'); // mark at show time: once per session, period
      setVisible(true);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, isAdmin]);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <div className="fixed inset-x-4 bottom-24 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-sm z-[70] fade-in">
      <aside
        aria-labelledby="order-promo-title"
        aria-describedby="order-promo-description"
        className="relative bg-surface border border-surface-variant rounded-xl shadow-2xl p-5"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 p-1.5 rounded-full text-outline hover:text-white hover:bg-surface-highest transition-colors"
        >
          <HiX aria-hidden="true" className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div aria-hidden="true" className="w-10 h-10 shrink-0 bg-primary/15 border border-primary/30 rounded-xl flex items-center justify-center">
            <HiChip className="w-5 h-5 text-primary-dim" />
          </div>
          <div className="min-w-0">
            <h3 id="order-promo-title" className="text-sm font-semibold text-white pr-6">
              Want it fully built?
            </h3>
            <p id="order-promo-description" className="mt-1 text-sm text-outline leading-relaxed">
              Skip the assembly — at <span className="text-white font-medium">order.inovitaz.in</span> you can buy any project fully completed, tested, and delivered to you.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href={orderSiteUrl()}
                className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <HiChip aria-hidden="true" className="w-4 h-4" />
                Order a built project
              </a>
              <button
                type="button"
                onClick={dismiss}
                className="px-4 py-2 rounded-full text-sm font-medium text-outline hover:text-white border border-surface-variant hover:bg-surface-high transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default OrderPromoPopup;
