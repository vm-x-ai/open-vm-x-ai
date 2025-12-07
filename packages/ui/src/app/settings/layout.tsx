import Layout from '@/components/Layout/Layout';

export const metadata = {
  title: 'VM-X AI Console - Settings',
  description: 'VM-X AI Console - Settings',
};

type LayoutProps = {
  children: React.ReactNode;
};

export default async function GettingStartedLayout({ children }: LayoutProps) {
  return (
    <Layout>
      <div className="mt-18">{children}</div>
    </Layout>
  );
}
