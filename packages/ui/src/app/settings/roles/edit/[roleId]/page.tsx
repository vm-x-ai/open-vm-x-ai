import { getRoleById } from '@/clients/api';
import { submitForm } from './actions';
import RoleForm from '@/components/Roles/Form';
import Alert from '@mui/material/Alert';

export const metadata = {
  title: 'VM-X AI Console - Settings - Edit Role',
  description: 'VM-X AI Console - Settings - Edit Role',
};

export type PageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { roleId } = await params;
  const role = await getRoleById({
    path: {
      roleId,
    },
    query: {
      includesMembers: true,
    },
  });

  if (role.error) {
    return (
      <Alert variant="filled" severity="error">
        Failed to fetch role: {role.error.errorMessage}
      </Alert>
    );
  }

  return <RoleForm submitAction={submitForm} role={role.data} />;
}
