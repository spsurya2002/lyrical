import { Router } from 'express';
import { getEntitlements, refuseChatbot } from '../../domain/entitlements.js';
import { modelLimiter } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errors.js';

/**
 * POST /api/chat/:slug — the in-context chatbot (objective.md, feature D).
 *
 * THE CHATBOT ITSELF IS NOT BUILT. This is its entitlement gate, deliberately
 * shipped ahead of it.
 *
 * FR-030: the server decides what a viewer may do, never the interface. The
 * song page shows the chatbot entry to Basic users marked PRO rather than
 * hiding it — so the request is one devtools visit away, and hiding a button
 * has never been a security boundary. The refusal has to live here.
 *
 * Pro reaches a 501: they are entitled to a feature that does not exist yet.
 * Answering anything else would be pretending it does.
 *
 * Rate limited now, not later. Constitution Principle VI: a model-calling route
 * without a limit is an unfinished feature, and this route's whole purpose is to
 * become one.
 */
export const chatRouter = Router();

chatRouter.post('/chat/:slug', modelLimiter, (req, res, next) => {
  try {
    const entitlements = getEntitlements(req.viewer);
    const refusal = refuseChatbot(entitlements);

    if (refusal !== null) {
      throw new HttpError(402, 'the chatbot is a Pro feature', refusal);
    }

    throw new HttpError(501, 'the chatbot is not built yet', 'NOT_IMPLEMENTED');
  } catch (error) {
    next(error);
  }
});
