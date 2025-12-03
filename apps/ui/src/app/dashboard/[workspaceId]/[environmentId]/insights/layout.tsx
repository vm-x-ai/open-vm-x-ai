import SubTabs from '@/components/Tabs/SubTabs';

export const metadata = {
  title: 'VM-X AI Console - Insights',
  description: 'VM-X AI Console - Insights',
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
    environmentId: string;
  }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { workspaceId, environmentId } = await params;
  const tabs = [
    {
      path: `/dashboard/${workspaceId}/${environmentId}/insights/audit`,
      name: 'Audit',
    },
    {
      path: `/dashboard/${workspaceId}/${environmentId}/insights/usage`,
      name: 'Usage',
    },
  ];

  return (
    <SubTabs pathPattern={'^/dashboard/[^/]+/[^/]+/[^/]+/[^/]+'} tabs={tabs}>
      {children}
    </SubTabs>
  );
}
