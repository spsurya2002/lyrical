import { config } from '../../config/index.js';
import { LlmError, type LlmProvider, type LlmRequest, type LlmResponse } from '../LlmProvider.js';

/**
 * Ollama, running locally.
 *
 * ⚠️ UNVERIFIED. Written from documentation; Ollama was not installed when this
 * was written, so nothing here has been executed. The shape guard below exists
 * for that reason — a wrong assumption fails loudly instead of silently
 * producing something plausible.
 *
 * Worth having for development: unlimited, free, and nothing leaves the machine.
 * Debugging a pipeline means running the same song through it fifty times, and
 * doing that against a metered API burns a daily quota on nothing.
 */

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

export function createOllamaProvider(model: string = 'llama3.1'): LlmProvider {
  return {
    name: 'ollama',
    async complete(request: LlmRequest): Promise<LlmResponse> {
      const body = {
        model,
        prompt: request.prompt,
        ...(request.system === undefined ? {} : { system: request.system }),
        stream: false,
        options: { temperature: request.temperature ?? 0.2 },
      };

      let res: Response;
      try {
        res = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (cause) {
        throw new LlmError(
          `Ollama unreachable at ${config.OLLAMA_BASE_URL} — is it running?`,
          'ollama',
          { cause },
        );
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new LlmError(`Ollama returned ${res.status}: ${detail.slice(0, 300)}`, 'ollama');
      }

      const parsed = (await res.json()) as OllamaGenerateResponse;
      if (parsed.error !== undefined) {
        throw new LlmError(`Ollama error: ${parsed.error}`, 'ollama');
      }
      if (typeof parsed.response !== 'string' || parsed.response.length === 0) {
        throw new LlmError(
          'Ollama response did not match the expected shape (expected a `response` string). ' +
            'This adapter was written from documentation and never executed — verify the shape.',
          'ollama',
        );
      }

      return { text: parsed.response, model };
    },
  };
}
