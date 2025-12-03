import { getPermissions } from '@/clients/api';
import { submitForm } from './actions';
import CreateRoleForm from '@/components/Roles/Form';
import Alert from '@mui/material/Alert';

export const metadata = {
  title: 'VM-X AI Console - Settings - New Role',
  description: 'VM-X AI Console - Settings - New Role',
};

export default async function Page() {
  const permissions = await getPermissions()
  if (permissions.error) {
    return (
      <Alert variant="filled" severity="error">
        Failed to load permissions {permissions.error.errorMessage}
      </Alert>
    );
  }

  return (
    <CreateRoleForm
      submitAction={submitForm}
      permissions={permissions.data}
    />
  );
}
