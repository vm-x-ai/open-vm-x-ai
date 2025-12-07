'use server';

import { assignUsersToRole, createRole, RolePolicy } from '@/clients/api';
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

  const { error, data: response } = await createRole({
    body: {
      ...payload,
      policy: data.policy as RolePolicy,
    },
  });

  if (!response) {
    return {
      ...prevState,
      success: false,
      message: error?.errorMessage ?? 'Failed to create role',
      data,
    };
  }

  if (members?.length) {
    const { error: assignError } = await assignUsersToRole({
      path: {
        roleId: response?.roleId,
      },
      body: {
        userIds: members
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

  return {
    ...prevState,
    success: true,
    message: 'Role created successfully',
    data,
    response: response,
  };
}
