import { z } from 'zod';

export const PatchSchema = z.object({
  summary: z.string(),
  diffs: z.array(z.object({ file: z.string(), patch: z.string() })),
});

export type Patch = z.infer<typeof PatchSchema>;

