import { useState } from 'react';

interface Props {
  slug: string;
}

/**
 * "Tell me when this is explained" (FR-038).
 *
 * The copy deliberately says the request is RECORDED, not that an email will
 * arrive — delivery is not built, and promising a message that cannot come is
 * its own kind of invention. When sending exists, this wording changes with it.
 */
export function NotifyMe({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');

  if (state === 'done') {
    return (
      <p data-testid="notify-done" className="text-sm text-grounded">
        Noted. We’ve recorded that you want this one explained.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        data-testid="notify-open"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border-default px-3 py-2 text-sm text-secondary transition-colors hover:border-border-strong hover:text-primary"
      >
        Tell me when it’s explained
      </button>
    );
  }

  return (
    <form
      data-testid="notify-form"
      className="flex flex-wrap items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setState('sending');
        fetch(`/api/songs/${encodeURIComponent(slug)}/notify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email }),
        })
          .then((res) => setState(res.ok ? 'done' : 'failed'))
          .catch(() => setState('failed'));
      }}
    >
      <label className="sr-only" htmlFor="notify-email">
        Email address
      </label>
      <input
        id="notify-email"
        data-testid="notify-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="rounded-md border border-border-default bg-inset px-3 py-2 text-sm text-primary placeholder:text-faint"
      />
      <button
        type="submit"
        data-testid="notify-submit"
        disabled={state === 'sending'}
        className="rounded-md border border-accent-edge px-3 py-2 text-sm text-accent transition-colors hover:border-accent hover:text-accent-hover disabled:opacity-50"
      >
        {state === 'sending' ? 'Recording…' : 'Record it'}
      </button>
      {state === 'failed' && (
        <p data-testid="notify-failed" className="w-full text-sm text-ungrounded">
          That didn’t save. Nothing was recorded — try again.
        </p>
      )}
    </form>
  );
}
