// HTTP surface of the assistant feature.
import { Router } from 'express';

import { genAiLimiter } from '../../middleware/rate-limit.js';
import { validateBody } from '../../middleware/validate.js';
import { askRequestSchema, type AskRequest } from './schemas.js';
import { askAssistant } from './service.js';

/** Router mounted at /api/assistant. */
export const assistantRoutes: Router = Router();

assistantRoutes.post('/ask', genAiLimiter, validateBody(askRequestSchema), (req, res, next) => {
  askAssistant(req.body as AskRequest)
    .then((answerResponse) => res.json(answerResponse))
    .catch((error: unknown) => {
      next(error);
    });
});
