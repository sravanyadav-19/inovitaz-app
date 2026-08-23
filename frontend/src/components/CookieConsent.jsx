import { Link } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext';

/**
 * Compact, optional-consent banner. It is only shown after a meaningful browse
 * action, so it does not cover the first screen or interrupt a payment flow.
 */
export default function CookieConsent() {
  const { consent, isPromptVisible, accept, decline } = useCookieConsent();

  if (consent || !isPromptVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <aside
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        className="pointer-events-auto max-w-2xl mx-auto bg-surface border border-surface-variant rounded-xl shadow-2xl px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <h3 id="cookie-consent-title" className="text-sm font-semibold text-white">
            Cookie preferences
          </h3>
          <p id="cookie-consent-description" className="mt-1 text-xs sm:text-sm text-outline leading-relaxed">
            Essential storage keeps you signed in. With your permission, we use anonymous analytics to improve InovitaZ.{' '}
            <Link
              to="/cookies"
              className="text-primary hover:text-primary-dim font-medium underline underline-offset-2"
            >
              Cookie Policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-outline hover:text-white border border-surface-variant hover:bg-surface-high transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="btn btn-primary px-3.5 py-2 rounded-lg text-sm font-semibold"
          >
            Accept
          </button>
        </div>
      </aside>
    </div>
  );
}
