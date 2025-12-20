import { RoleEntity } from '@/clients/api';
import { zRolePolicy } from '@/clients/api/zod.gen';
import type { FormActionState } from '@/types';
import { z } from 'zod';

export const memberSchema = z.object({
  userId: z.string(),
  assignedAt: z.string().optional(),
  assignedBy: z.string().optional(),
});

export type MemberSchema = z.output<typeof memberSchema>;

export const schema = z.object({
  roleId: z.string().optional(),
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
  members: z.array(memberSchema).optional(),
  newMembers: z.array(memberSchema).optional(),
  removedMembers: z.array(memberSchema).optional(),
});

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, RoleEntity>;
