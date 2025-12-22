'use server';

import { assignUsersToRole, createUser, UserState } from '@/clients/api';
import {
  type FormSchema,
  type FormAction,
  schema,
} from '@/components/Users/Form/Create';

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

  const { roleIds, confirmPassword, ...payload } = data;

  const { error, data: response } = await createUser({
    body: {
      ...payload,
      state: payload.state as UserState,
      username: payload.email as string,
      password: payload.password as string,
    },
  });

  if (error) {
    return {
      ...prevState,
      success: false,
      message: error?.errorMessage ?? 'Failed to create user',
      data,
    };
  }

  if (roleIds?.length) {
    await Promise.all(
      roleIds.map(async (roleId) =>
        assignUsersToRole({
          path: {
            roleId,
          },
          body: {
            userIds: [response?.id],
          },
        })
      )
    );
  }

  return {
    ...prevState,
    success: true,
    message: 'User created successfully',
    data,
    response: response,
  };
}
