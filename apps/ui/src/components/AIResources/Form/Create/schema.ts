import { AiResourceEntity } from '@/clients/api';
import { zAiResourceModelConfigEntity } from '@/clients/api/zod.gen';
import type { FormActionState } from '@/types';
import { z } from 'zod';

export const schema = z.object({
  workspaceId: z.string(),
  environmentId: z.string(),
  name: z
    .string({
      error: 'Resource name is required.',
    })
    .trim()
    .describe('Resource name needs to be unique within the environment.'),
  description: z.string({
    error: 'Description is required.',
  }),
  model: z.object(
    {
      ...zAiResourceModelConfigEntity.shape,
    },
    {
      error: 'Primary model is required.',
    }
  ),
  assignApiKeys: z.array(z.string()),
});

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, AiResourceEntity>;
