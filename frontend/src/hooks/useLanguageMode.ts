import { useCallback, useState } from 'react';
import type { Mode } from '../types.js';

const STORAGE_KEY = 'lyricsense.mode';
const DEFAULT_MODE: Mode = 'en';

function isMode(value: unknown): value is Mode {
  return value === 'en' || value === 'hi' || value === 'hi-Latn';
}

function read(): Mode {
  // Storage can throw or return nothing — a private window, blocked site data,
  // a preview. The mode is a convenience, so failure falls back silently.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/**
 * The chosen language mode, remembered across visits (FR-016).
 *
 * Per device for now. R-09 says a signed-in user's choice should follow their
 * account; that needs the accounts feature, which does not exist yet. Until
 * then this is per browser, which is what a signed-out visitor gets anyway.
 */
export function useLanguageMode(): [Mode, (mode: Mode) => void] {
  const [mode, setModeState] = useState<Mode>(read);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice is not worth failing the switch.
    }
  }, []);

  return [mode, setMode];
}
