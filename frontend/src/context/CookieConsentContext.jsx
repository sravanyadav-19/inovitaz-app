import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'inovitaz_cookie_consent';
const CONSENT_REQUEST_EVENT = 'inovitaz:request-cookie-consent';

const CookieConsentContext = createContext(null);

/**
 * Holds the visitor's cookie choice and controls when the optional-consent
 * banner is shown. The banner is deliberately delayed until a meaningful
 * browse action rather than appearing over the first screen.
 */
export function CookieConsentProvider({ children }) {
  const location = useLocation();
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const isActiveAccountForm = [
    '/login',
    '/signup',
    '/forgot-password',
  ].includes(location.pathname) || location.pathname.startsWith('/reset-password');

  const requestConsent = useCallback(() => {
    if (!consent && !isActiveAccountForm) {
      setIsPromptVisible(true);
    }
  }, [consent, isActiveAccountForm]);

  useEffect(() => {
    if (isActiveAccountForm) setIsPromptVisible(false);
  }, [isActiveAccountForm]);

  useEffect(() => {
    if (consent || isPromptVisible || isActiveAccountForm) return undefined;

    const handleRequest = () => requestConsent();
    const handleMeaningfulScroll = () => {
      if (window.scrollY >= 180) requestConsent();
    };

    window.addEventListener(CONSENT_REQUEST_EVENT, handleRequest);
    window.addEventListener('scroll', handleMeaningfulScroll, { passive: true });

    return () => {
      window.removeEventListener(CONSENT_REQUEST_EVENT, handleRequest);
      window.removeEventListener('scroll', handleMeaningfulScroll);
    };
  }, [consent, isPromptVisible, isActiveAccountForm, requestConsent]);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // Storage is unavailable — keep the choice for this session.
    }
    setConsent('accepted');
    setIsPromptVisible(false);
  }, []);

  const decline = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'declined');
    } catch {
      // Storage is unavailable — keep the choice for this session.
    }
    setConsent('declined');
    setIsPromptVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      isPromptVisible,
      requestConsent,
      accept,
      decline,
    }),
    [consent, isPromptVisible, requestConsent, accept, decline]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    return {
      consent: null,
      isPromptVisible: false,
      requestConsent: () => {},
      accept: () => {},
      decline: () => {},
    };
  }
  return ctx;
}

/** Call this from a meaningful user action without coupling components to React context. */
export function requestCookieConsent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
  }
}

export default CookieConsentContext;
