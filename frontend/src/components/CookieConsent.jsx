import { Link } from "react-router-dom";
import { useCookieConsent } from "../context/CookieConsentContext";

/**
 * Cookie consent banner.
 * Shown until the visitor makes a choice; the choice is remembered in
 * localStorage. Non-essential analytics (Vercel) is only enabled on "Accept".
 */
export default function CookieConsent() {
  const { consent, accept, decline } = useCookieConsent();

  if (consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-surface border border-surface-variant rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            We value your privacy
          </h3>
          <p className="text-sm text-outline leading-relaxed">
            We use essential storage to keep you signed in, and — with your
            consent — anonymous analytics to understand how InovitaZ is used so
            we can improve it.{" "}
            <Link
              to="/cookies"
              className="text-primary hover:text-primary-dim font-medium underline underline-offset-2"
            >
              Read our Cookie Policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-medium text-outline hover:text-white border border-surface-variant hover:bg-surface-high transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="btn btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
