import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { PassportResult } from '../auth/strategies/oidc.strategy';
import { PublicWorkspaceUserRole } from '../storage/entities.generated';

export const WorkspaceMemberGuard = (
  role?: PublicWorkspaceUserRole
): Type<CanActivate> => {
  @Injectable()
  class MixinRoleGuard implements CanActivate {
    constructor(private readonly workspaceService: WorkspaceService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user as PassportResult;
      if (!user) {
        return false;
      }

      await this.workspaceService.throwIfNotWorkspaceMember(
        request.params.workspaceId,
        user.user.id,
        role
      );
      return true;
    }
  }
  return MixinRoleGuard;
};
