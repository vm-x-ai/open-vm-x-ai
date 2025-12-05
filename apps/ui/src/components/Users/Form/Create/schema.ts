import { UserEntity } from '@/clients/api';
import type { FormActionState } from '@/types';
import { z } from 'zod';

export const schema = z
  .object({
    name: z.string({ error: 'Name is required.' }),
    firstName: z.string({ error: 'First name is required.' }),
    lastName: z.string({ error: 'Last name is required.' }),
    email: z.email({ error: 'Email is required.' }),
    username: z.string({ error: 'Username is required.' }),
    password: z
      .string({ error: 'Password is required.' })
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]).{8,32}$/,
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }
      ),
    confirmPassword: z.string({ error: 'Confirm password is required.' }),
    roleIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.password &&
      data.confirmPassword &&
      data.password !== data.confirmPassword
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match.',
        path: ['confirmPassword'],
      });
    }
  });

export type FormSchema = z.output<typeof schema>;

export type FormAction = FormActionState<FormSchema, UserEntity>;
