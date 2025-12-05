'use server';

import { auth, signOut } from '@/auth';

export const signOutAction = async () => {
  const session = await auth();
  await signOut({
    redirectTo: `/api/federated/sign-out?id_token=${session?.idToken}`,
  });
};
