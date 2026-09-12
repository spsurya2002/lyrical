import { config } from '../../config/index.js';
import { LlmError, type LlmProvider, type LlmRequest, type LlmResponse } from '../LlmProvider.js';

/**
 * Google Gemini, over its REST API.
 *
 * ⚠️ UNVERIFIED. The request and response shapes below are written from
 * documentation, not from a call that was actually made — there was no API key
 * available when this was written, so nothing here has been executed against
 * the real service. The shape guard in `extractText` exists precisely because
 * of that: if the response differs from what was assumed, this fails with a
 * message saying so rather than returning something plausible and wrong.
 *
 * Before relying on this: set GEMINI_API_KEY and run it once.
 *
 * No SDK, just fetch. One less dependency, and nothing to leak out of this
 * directory in the first place.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

function extractText(body: unknown, model: string): string {
  const response = body as GeminiResponse;

  if (response.promptFeedback?.blockReason !== undefined) {
    throw new LlmError(
      `Gemini blocked the prompt: ${response.promptFeedback.blockReason}`,
      'gemini',
    );
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new LlmError(
      `Gemini response did not match the expected shape for ${model}. ` +
        `Expected candidates[0].content.parts[0].text. ` +
        `This adapter was written from documentation and never executed — verify the shape.`,
      'gemini',
    );
  }
  return text;
}

export function createGeminiProvider(model: string = config.LLM_MODEL_RENDERING): LlmProvider {
  return {
    name: 'gemini',
    async complete(request: LlmRequest): Promise<LlmResponse> {
      const apiKey = config.GEMINI_API_KEY;
      if (apiKey === undefined || apiKey.length === 0) {
        throw new LlmError('GEMINI_API_KEY is not set', 'gemini');
      }

      const body = {
        contents: [{ parts: [{ text: request.prompt }] }],
        ...(request.system === undefined
          ? {}
          : { systemInstruction: { parts: [{ text: request.system }] } }),
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          ...(request.maxOutputTokens === undefined
            ? {}
            : { maxOutputTokens: request.maxOutputTokens }),
        },
      };

      let res: Response;
      try {
        res = await fetch(`${BASE}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
        });
      } catch (cause) {
        throw new LlmError('Gemini request failed', 'gemini', { cause });
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new LlmError(`Gemini returned ${res.status}: ${detail.slice(0, 300)}`, 'gemini');
      }

      return { text: extractText(await res.json(), model), model };
    },
  };
}
