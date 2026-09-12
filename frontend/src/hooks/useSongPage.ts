import { useEffect, useRef, useState } from 'react';
import type { Mode, SongPageResponse } from '../types.js';

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: SongPageResponse }
  | { status: 'missing' }
  | { status: 'error'; message: string };

/**
 * Loads a song page.
 *
 * Two behaviours worth knowing:
 *
 * 1. 'missing' is distinct from 'error'. Collapsing them would tell a user
 *    something broke when the honest answer is that we do not have that song.
 *
 * 2. Switching MODE keeps the current page on screen until the new one arrives,
 *    so no loading state is ever shown (FR-014). All three renderings are
 *    already stored, so the swap is a fetch away — not a regeneration. Only a
 *    change of song drops back to 'loading'.
 */
export function useSongPage(slug: string, mode: Mode): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  const loadedSlug = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // A new song starts empty; a new mode keeps what is already on screen.
    if (loadedSlug.current !== slug) {
      setState({ status: 'loading' });
    }

    fetch(`/api/songs/${encodeURIComponent(slug)}?mode=${mode}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: 'missing' });
          return;
        }
        if (!res.ok) {
          setState({ status: 'error', message: `request failed (${res.status})` });
          return;
        }
        const page = (await res.json()) as SongPageResponse;
        if (cancelled) return;
        loadedSlug.current = slug;
        setState({ status: 'ready', page });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'network error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, mode]);

  return state;
}
