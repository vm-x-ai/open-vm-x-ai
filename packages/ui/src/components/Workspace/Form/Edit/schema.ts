import { WorkspaceEntity } from '@/clients/api';
import { zWorkspaceUserRole } from '@/clients/api/zod.gen';
import type { FormActionState } from '@/types';
import { z } from 'zod';

export const memberSchema = z.object({
  userId: z.string(),
  role: zWorkspaceUserRole,
  addedAt: z.string().optional(),
  addedBy: z.string().optional(),
});

export type MemberSchema = z.output<typeof memberSchema>;

export const schema = z.object({
  workspaceId: z.string(),
  name: z
    .string({
      error: 'Workspace name is required.',
    })
    .trim()
    .min(3, { message: 'Workspace name must be at least 3 characters long.' }),
  description: z.string().optional(),
  members: z.array(memberSchema).optional(),
  newMembers: z.array(memberSchema).optional(),
  removedMembers: z.array(memberSchema).optional(),
  updatedMembers: z.array(memberSchema).optional(),
});

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, WorkspaceEntity>;
