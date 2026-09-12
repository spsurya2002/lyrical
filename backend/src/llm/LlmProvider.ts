/**
 * The model interface.
 *
 * Every model call in the codebase goes through this. No provider SDK type may
 * appear outside `src/llm/providers/` — the moment one leaks into a service
 * signature, changing provider becomes a refactor instead of a new file. There
 * is a test asserting this (tests/unit/noProviderLeak.test.ts).
 *
 * Provider and model are configuration PER JOB, not one global setting: the
 * jobs this product runs have genuinely different needs. Explanation generation
 * is cached forever, so its quality is baked into the catalogue permanently and
 * is worth paying for. A chatbot reply is ephemeral. See tech_stack.md.
 */

export interface LlmRequest {
  /** Instructions that constrain the output — language, script, what not to do. */
  readonly system?: string;
  readonly prompt: string;
  readonly maxOutputTokens?: number;
  /** Low for rendering work: this is translation, not invention. */
  readonly temperature?: number;
}

export interface LlmResponse {
  readonly text: string;
  readonly model: string;
}

export interface LlmProvider {
  readonly name: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}

/** Thrown when a provider is unreachable, refuses, or answers in an unexpected shape. */
export class LlmError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'LlmError';
  }
}
