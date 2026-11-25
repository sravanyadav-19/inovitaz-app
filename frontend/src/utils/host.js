/**
 * Host/subdomain detection for the order.inovitaz.in experience.
 * Same codebase, same deploy — the subdomain just renders a different root.
 */

export const isOrderHost = () =>
  typeof window !== 'undefined' &&
  window.location.hostname.split('.')[0].toLowerCase() === 'order';

/** Main site base URL — used for "browse docs / main site" links. */
export const mainSiteUrl = () => {
  if (typeof window === 'undefined') return 'https://inovitaz.in';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return `${window.location.protocol}//${host}:${window.location.port}`;
  return 'https://inovitaz.in';
};

/** Order subdomain base — used for "order a build" CTAs on the main site. */
export const orderSiteUrl = () => {
  if (typeof window === 'undefined') return 'https://order.inovitaz.in';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return `${window.location.protocol}//${host}:${window.location.port}`;
  return 'https://order.inovitaz.in';
};
