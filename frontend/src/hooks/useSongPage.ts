import { useEffect, useState } from 'react';
import type { Mode, SongPageResponse } from '../types.js';

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: SongPageResponse }
  | { status: 'missing' }
  | { status: 'error'; message: string };

/**
 * Loads a song page.
 *
 * Distinguishes 'missing' (no such song) from 'error' (something broke) —
 * collapsing the two would show a user "something went wrong" when the honest
 * answer is "we do not have that song".
 */
export function useSongPage(slug: string, mode: Mode): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

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
        if (!cancelled) setState({ status: 'ready', page });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', message: error instanceof Error ? error.message : 'network error' });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, mode]);

  return state;
}
