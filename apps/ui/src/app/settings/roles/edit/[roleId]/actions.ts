'use server';

import {
  assignUsersToRole,
  RolePolicy,
  unassignUsersFromRole,
  updateRole,
} from '@/clients/api';
import {
  type FormSchema,
  type FormAction,
  schema,
} from '@/components/Roles/Form';

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

  const { members, newMembers, removedMembers, roleId, ...payload } = data;
  if (!roleId) {
    return {
      ...prevState,
      success: false,
      message: 'Role ID is required',
      data,
    };
  }

  const { error, data: response } = await updateRole({
    path: {
      roleId,
    },
    body: {
      ...payload,
      policy: data.policy as RolePolicy,
    },
  });

  if (!response) {
    return {
      ...prevState,
      success: false,
      message: error?.errorMessage ?? 'Failed to update role',
      data,
    };
  }

  if (newMembers?.length) {
    const { error: assignError } = await assignUsersToRole({
      path: {
        roleId: response?.roleId,
      },
      body: {
        userIds: newMembers
          .map((member) => member.userId)
          .filter(Boolean) as string[],
      },
    });

    if (assignError) {
      return {
        ...prevState,
        success: false,
        message: assignError?.errorMessage ?? 'Failed to assign users to role',
        data,
      };
    }
  }

  if (removedMembers?.length) {
    const { error: unassignError } = await unassignUsersFromRole({
      path: {
        roleId: response?.roleId,
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
          unassignError?.errorMessage ?? 'Failed to unassign users from role',
        data,
      };
    }
  }

  return {
    ...prevState,
    success: true,
    message: 'Role updated successfully',
    data,
    response: response,
  };
}
