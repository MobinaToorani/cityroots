"use client";

import { useSyncExternalStore } from "react";

/**
 * A small value kept in localStorage that every component on the page stays in
 * sync with. Server rendering and first paint always see `fallback`.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cachedValue = fallback;

  function read(): T {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback; // Storage is blocked; behave as if it were empty.
    }
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try {
      cachedValue = raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  }

  function write(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      return; // Storage is blocked; nothing to persist.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    read,
    write,
    use: () => useSyncExternalStore(subscribe, read, () => fallback),
  };
}
