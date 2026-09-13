import { ProBadge } from './ProBadge.js';

interface Props {
  available: boolean;
  signedIn: boolean;
}

/**
 * The entry point to the in-context chatbot (objective.md, feature D).
 *
 * Shown to everyone, working for nobody yet — the chatbot is a separate
 * feature. What this page owes is the honest state: Pro users see it as theirs,
 * Basic users see what they would get rather than an absence (FR-029).
 *
 * The copy promises what the chatbot will actually do. It answers from this
 * song's stored sources and says so when a question falls outside them — the
 * same grounding rule as the page, because a chatbot that invents would undo
 * everything the rest of the product is careful about.
 */
export function ChatbotEntry({ available, signedIn }: Props) {
  return (
    <div
      data-testid="chatbot-entry"
      data-available={available}
      className="mt-8 rounded-md border border-border-subtle bg-surface p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Ask about this song</h3>
        {!available && <ProBadge />}
      </div>

      <p className="mb-3 max-w-measure text-sm text-secondary">
        Answers come only from this song’s stored sources — and it says so when a question
        falls outside them.
      </p>

      <button
        type="button"
        disabled={!available}
        data-testid="chatbot-open"
        className="rounded-md border border-border-default px-3 py-2 text-sm text-secondary transition-colors enabled:hover:border-border-strong enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {available ? 'Ask a question' : signedIn ? 'Upgrade to ask' : 'Sign in to upgrade'}
      </button>
    </div>
  );
}
