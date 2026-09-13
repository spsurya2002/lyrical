import { useEffect, useState } from 'react';

/** The breakpoint where the meaning panel becomes a bottom sheet (design_system.md §6). */
const NARROW = '(max-width: 1099px)';

/**
 * Whether the viewport is narrow enough for the sheet layout.
 *
 * Used to render EITHER the panel or the sheet, never both. Rendering both and
 * hiding one with CSS would duplicate every test id and every fetch the panel
 * makes, and screen readers would announce the hidden copy.
 */
export function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => {
    // matchMedia is absent in some test environments; assume desktop there.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(NARROW).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(NARROW);
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    query.addEventListener('change', onChange);
    setNarrow(query.matches);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return narrow;
}
