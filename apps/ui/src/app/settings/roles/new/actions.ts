'use server';

import { createRole, RolePolicy } from '@/clients/api';
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

  const { error, data: response } = await createRole({
    body: {
      ...data,
      policy: data.policy as RolePolicy,
    },
  });

  return {
    ...prevState,
    success: !!response,
    message: response
      ? 'Role created successfully'
      : error?.errorMessage ?? 'Failed to create role',
    data,
    response: response,
  };
}
