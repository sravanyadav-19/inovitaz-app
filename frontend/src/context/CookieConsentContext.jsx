import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const STORAGE_KEY = "inovitaz_cookie_consent";

const CookieConsentContext = createContext(null);

/**
 * Holds the visitor's cookie consent choice ("accepted" | "declined" | null)
 * so the banner and the analytics integration stay in sync.
 */
export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // storage unavailable — treat as accepted for this session
    }
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
    } catch {
      // storage unavailable — treat as declined for this session
    }
    setConsent("declined");
  }, []);

  const value = useMemo(
    () => ({ consent, accept, decline }),
    [consent, accept, decline]
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
    // Safe fallback when used outside the provider.
    return { consent: null, accept: () => {}, decline: () => {} };
  }
  return ctx;
}

export default CookieConsentContext;
