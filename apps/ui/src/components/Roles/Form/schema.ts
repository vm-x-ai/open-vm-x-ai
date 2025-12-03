import { RoleEntity } from '@/clients/api';
import { zRolePolicy } from '@/clients/api/zod.gen';
import type { FormActionState } from '@/types';
import { z } from 'zod';

export const schema = z.object({
  name: z
    .string({
      error: 'Role name is required.',
    })
    .trim()
    .min(3, { message: 'Role name must be at least 3 characters long.' }),
  description: z.string(),
  policy: z.object(
    {
      ...zRolePolicy.shape,
    },
    {
      error: 'Policy is required.',
    }
  ),
});

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, RoleEntity>;
