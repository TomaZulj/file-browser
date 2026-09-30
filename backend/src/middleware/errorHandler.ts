import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('; ');
    res.status(400).json({ error: message });
  } else if (error.status && error.status < 500) {
    res.status(error.status).json({ error: error.message });
  } else if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
  } else {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
