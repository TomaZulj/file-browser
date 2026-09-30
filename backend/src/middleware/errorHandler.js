import { ZodError } from 'zod';

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('; ');
    return res.status(400).json({ error: message });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
