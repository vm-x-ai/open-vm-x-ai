import { submitForm } from './actions';
import RoleForm from '@/components/Roles/Form';

export const metadata = {
  title: 'VM-X AI Console - Settings - New Role',
  description: 'VM-X AI Console - Settings - New Role',
};

export default async function Page() {
  return <RoleForm submitAction={submitForm} />;
}
