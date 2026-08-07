"use client";

import { useSyncExternalStore } from "react";

/**
 * Collapsed-rail preference, kept in a tiny external store per storage key so
 * each dashboard (Admin, Student) remembers its own rail independently.
 *
 * localStorage cannot be read during render without the server and client
 * disagreeing. `useSyncExternalStore` is the sanctioned escape hatch: the
 * server snapshot is the expanded default, and React re-renders with the real
 * value right after hydration instead of throwing a mismatch.
 *
 * Until the user states a preference, the rail follows the viewport: collapsed
 * on tablet-width screens where a 17rem rail would crowd the content, expanded
 * on wider ones. An explicit toggle is stored and wins from then on.
 *
 * Only this cosmetic boolean is persisted. No identity, token, or session data
 * is ever written here.
 */
const tabletQuery = "(max-width: 1279.98px)";

type PreferenceStore = {
  cached: boolean | null;
  listeners: Set<() => void>;
  mediaBound: boolean;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
};

const stores = new Map<string, PreferenceStore>();

function readStoredValue(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return null;
  }
}

function prefersCollapsedByViewport(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(tabletQuery).matches
    : false;
}

function getStore(storageKey: string): PreferenceStore {
  const existing = stores.get(storageKey);

  if (existing) {
    return existing;
  }

  // `subscribe` and `getSnapshot` must keep stable identities across renders,
  // so they are created once per key and cached with the store.
  const store: PreferenceStore = {
    cached: null,
    listeners: new Set(),
    mediaBound: false,
    subscribe: (listener) => {
      store.listeners.add(listener);
      bindMediaQuery(storageKey, store);

      return () => {
        store.listeners.delete(listener);
      };
    },
    getSnapshot: () => {
      if (store.cached === null) {
        const stored = readStoredValue(storageKey);
        store.cached =
          stored === null ? prefersCollapsedByViewport() : stored === "true";
      }

      return store.cached;
    },
  };

  stores.set(storageKey, store);

  return store;
}

/**
 * Re-evaluates the viewport default when the breakpoint is crossed. A stored
 * preference short-circuits this, so resizing never overrides an explicit
 * choice. Bound once per store and intentionally never torn down — the
 * dashboards live for the whole session.
 */
function bindMediaQuery(storageKey: string, store: PreferenceStore): void {
  if (store.mediaBound || typeof window.matchMedia !== "function") {
    return;
  }

  store.mediaBound = true;

  window.matchMedia(tabletQuery).addEventListener("change", () => {
    if (readStoredValue(storageKey) !== null) {
      return;
    }

    store.cached = null;
    store.listeners.forEach((listener) => listener());
  });
}

function getServerSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(storageKey: string, next: boolean): void {
  const store = getStore(storageKey);
  store.cached = next;

  try {
    window.localStorage.setItem(storageKey, String(next));
  } catch {
    // The preference is cosmetic; failing to persist it is not an error.
  }

  store.listeners.forEach((listener) => listener());
}

export function useSidebarCollapsed(storageKey: string): boolean {
  const store = getStore(storageKey);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
}
