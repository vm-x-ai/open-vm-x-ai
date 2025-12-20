'use server';

import {
  assignUsersToWorkspace,
  unassignUsersFromWorkspace,
  updateMemberRole,
  updateWorkspace,
  WorkspaceUserRole,
} from '@/clients/api';
import {
  type FormSchema,
  type FormAction,
  schema,
} from '@/components/Workspace/Form/Edit';

export async function submitForm(
  prevState: FormAction,
  data: FormSchema
): Promise<FormAction> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      ...prevState,
      success: false,
      message: 'Invalid form data',
      data,
    };
  }

  const {
    workspaceId,
    members,
    newMembers,
    removedMembers,
    updatedMembers,
    ...payload
  } = data;

  const { error, data: response } = await updateWorkspace({
    path: {
      workspaceId,
    },
    body: {
      ...payload,
    },
  });

  if (newMembers?.length) {
    const usersGroupedByRole = newMembers.reduce((acc, member) => {
      const role = member.role ?? WorkspaceUserRole.MEMBER;
      acc[role] = [...(acc[role] ?? []), member.userId as string];
      return acc;
    }, {} as Record<WorkspaceUserRole, string[]>);

    const assignResults = await Promise.all(
      Object.entries(usersGroupedByRole).map(([role, userIds]) =>
        assignUsersToWorkspace({
          path: {
            workspaceId,
          },
          body: {
            userIds,
            role: role as WorkspaceUserRole,
          },
        })
      )
    );

    if (assignResults.some((result) => result.error)) {
      return {
        ...prevState,
        success: false,
        message:
          assignResults.map((result) => result.error)?.join(', ') ??
          'Failed to assign users to workspace',
        data,
      };
    }
  }

  if (removedMembers?.length) {
    const { error: unassignError } = await unassignUsersFromWorkspace({
      path: {
        workspaceId,
      },
      body: {
        userIds: removedMembers
          .map((member) => member.userId)
          .filter(Boolean) as string[],
      },
    });

    if (unassignError) {
      return {
        ...prevState,
        success: false,
        message:
          unassignError?.errorMessage ??
          'Failed to unassign users from workspace',
        data,
      };
    }
  }

  if (updatedMembers?.length) {
    const updateResults = await Promise.all(
      updatedMembers.map((member) =>
        updateMemberRole({
          path: {
            workspaceId,
            userId: member.userId as string,
          },
          body: {
            role: member.role as WorkspaceUserRole,
          },
        })
      )
    );

    if (updateResults.some((result) => result.error)) {
      return {
        ...prevState,
        success: false,
        message:
          updateResults.map((result) => result.error)?.join(', ') ??
          'Failed to update members roles',
        data,
      };
    }
  }

  return {
    ...prevState,
    success: !!response,
    message: response
      ? 'Workspace updated successfully'
      : error?.errorMessage ?? 'Failed to update workspace',
    data,
    response: response,
  };
}
