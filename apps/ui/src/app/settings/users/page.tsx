import UserTable from '@/components/Users/Table';
import TabContent from '@/components/Tabs/TabContent';

export default async function Page() {
  return (
    <TabContent>
      <UserTable />
    </TabContent>
  );
}
