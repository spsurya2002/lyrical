import { config } from '../config/index.js';
import type { LlmProvider } from './LlmProvider.js';
import { createGeminiProvider } from './providers/gemini.js';
import { createOllamaProvider } from './providers/ollama.js';

/**
 * Resolves the provider for a job.
 *
 * The rest of the codebase asks for a provider and gets one; it never names a
 * vendor. Switching provider is a new adapter plus a config value, never a
 * change to a service.
 */
export function providerFor(job: 'rendering'): LlmProvider {
  switch (config.LLM_PROVIDER) {
    case 'gemini':
      return createGeminiProvider(config.LLM_MODEL_RENDERING);
    case 'ollama':
      return createOllamaProvider();
    default: {
      // Exhaustiveness: adding a provider to the config enum without adding it
      // here is a compile error, not a runtime surprise.
      const unreachable: never = config.LLM_PROVIDER;
      throw new Error(`unhandled provider: ${String(unreachable)} (job: ${job})`);
    }
  }
}

export type { LlmProvider, LlmRequest, LlmResponse } from './LlmProvider.js';
export { LlmError } from './LlmProvider.js';
