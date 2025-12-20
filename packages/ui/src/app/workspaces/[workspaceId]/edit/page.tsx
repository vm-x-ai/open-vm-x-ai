import { getWorkspaceById, getWorkspaceMembers } from '@/clients/api';
import WorkspaceEditForm from '@/components/Workspace/Form/Edit';
import Alert from '@mui/material/Alert';
import { submitForm } from './actions';

export type PageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { workspaceId } = await params;
  const [workspace, members] = await Promise.all([
    getWorkspaceById({
      path: {
        workspaceId,
      },
    }),
    getWorkspaceMembers({
      path: {
        workspaceId,
      },
    }),
  ]);
  if (workspace.error) {
    return (
      <Alert variant="filled" severity="error">
        Failed to fetch workspace: {workspace.error.errorMessage}
      </Alert>
    );
  }

  if (members.error) {
    return (
      <Alert variant="filled" severity="error">
        Failed to fetch members: {members.error.errorMessage}
      </Alert>
    );
  }

  return (
    <WorkspaceEditForm
      workspace={workspace.data}
      members={members.data}
      submitAction={submitForm}
    />
  );
}
