import { usePathname } from 'next/navigation';

export const useRoutePattern = () => {
  const pathname = usePathname();
  const routePatterns = [
    '/getting-started',
    '/dashboard/[workspaceId]/[environmentId]/ai-connections/edit/[connectionId]',
    '/dashboard/[workspaceId]/[environmentId]/ai-resources/edit/[resourceId]',
    '/dashboard/[workspaceId]/[environmentId]/security/auth/role/edit/[roleId]',
    '/dashboard/[workspaceId]/[environmentId]',
    '/dashboard/[workspaceId]',
  ];

  for (const pattern of routePatterns) {
    const regExp = new RegExp(
      `^${pattern
        .split('/')
        .map((part) =>
          part
            .replace(/\//g, '\\/')
            .replace(/\[.*\]/g, '[^\\/]')
            .replace(/\]/g, ']+'),
        )
        .join('/')}`,
    );
    const match = pathname ? regExp.exec(pathname) : null;
    if (pathname && match) {
      return pattern + pathname.slice(match[0].length);
    }
  }

  return pathname;
};
