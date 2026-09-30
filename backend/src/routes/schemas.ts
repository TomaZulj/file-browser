import { z } from 'zod';

const id = z.uuid();

const name = z
  .string()
  .trim()
  .min(1, 'name must not be empty')
  .max(255, 'name must be at most 255 characters')
  .refine((value) => !value.includes('/'), 'name must not contain "/"');

export const listQuery = z.object({ parentId: id.optional() });

export const createBody = z.object({
  name,
  type: z.enum(['file', 'folder']),
  parentId: id.nullish(),
});

export const idParams = z.object({ id });

export const searchQuery = z.object({ name: z.string().min(1), parentId: id.optional() });

export const suggestionsQuery = z.object({ prefix: z.string().min(1) });
