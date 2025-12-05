import { RoleEntity } from '@/clients/api';
import { zRolePolicy, zUserRoleDto } from '@/clients/api/zod.gen';
import type { FormActionState } from '@/types';
import { z } from 'zod';

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
  members: z.array(zUserRoleDto.partial()).optional(),
  newMembers: z.array(zUserRoleDto.partial()).optional(),
  removedMembers: z.array(zUserRoleDto.partial()).optional(),
});

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, RoleEntity>;
