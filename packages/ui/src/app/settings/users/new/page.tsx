import { submitForm } from './actions';
import CreateUserForm from '@/components/Users/Form/Create';

export const metadata = {
  title: 'VM-X AI Console - Settings - New User',
  description: 'VM-X AI Console - Settings - New User',
};

export default async function Page() {
  return <CreateUserForm submitAction={submitForm} />;
}
