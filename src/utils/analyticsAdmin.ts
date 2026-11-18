const ADMIN_STORAGE_KEY = 'trethub_admin_ignore';
const ADMIN_COOKIE_NAME = 'trethub_admin_ignore';
const ADMIN_OFF_TOKEN = 'trethub_off';
const ADMIN_ON_TOKEN = 'trethub_on';

let memoryAdminIgnore: boolean | null = null;
let initialUrlAction: 'paused' | 'resumed' | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const domainAttr = host.endsWith('trethub.shop') ? '; domain=.trethub.shop' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/${domainAttr}; SameSite=Lax`;
}

export function setAdminIgnore(ignored: boolean): void {
  memoryAdminIgnore = ignored;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (ignored) {
        window.localStorage.setItem(ADMIN_STORAGE_KEY, '1');
      } else {
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage access errors in restricted WebViews
  }
  try {
    writeCookie(ADMIN_COOKIE_NAME, ignored ? '1' : '', ignored ? 31536000 : 0);
  } catch {
    // Ignore cookie errors
  }
}

export function isAdminIgnored(): boolean {
  if (memoryAdminIgnore !== null) {
    return memoryAdminIgnore;
  }
  let stored = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      stored = window.localStorage.getItem(ADMIN_STORAGE_KEY) === '1';
    }
  } catch {
    // Ignore
  }
  if (!stored) {
    try {
      stored = readCookie(ADMIN_COOKIE_NAME) === '1';
    } catch {
      // Ignore
    }
  }
  memoryAdminIgnore = stored;
  return stored;
}

export function syncAdminIgnoreFromUrl(): 'paused' | 'resumed' | null {
  if (typeof window === 'undefined') return null;
  if (initialUrlAction !== null) return initialUrlAction;

  const url = new URL(window.location.href);
  const adminParam = url.searchParams.get('admin');

  if (adminParam === ADMIN_OFF_TOKEN) {
    setAdminIgnore(true);
    initialUrlAction = 'paused';
  } else if (adminParam === ADMIN_ON_TOKEN) {
    setAdminIgnore(false);
    initialUrlAction = 'resumed';
  }

  if (adminParam !== null) {
    url.searchParams.delete('admin');
    const cleanPath = `${url.pathname}${url.search}${url.hash}` || '/';
    try {
      window.history.replaceState(null, '', cleanPath);
    } catch {
      // Ignore
    }
  }

  return initialUrlAction;
}
