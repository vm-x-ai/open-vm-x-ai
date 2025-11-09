import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompletionAuditService } from './audit.service';
import { CompletionAuditEntity } from './entities/audit.entity';
import {
  ApiEnvironmentIdParam,
  ApiWorkspaceIdParam,
  EnvironmentIdParam,
  WorkspaceIdParam,
} from '../../common/api.decorators';
import { UserEntity } from '../../users/entities/user.entity';
import { AuthenticatedUser } from '../../auth/auth.guard';
import { ListAuditQueryDto } from './dto/list-audit.dto';

@Controller('completion-audit')
@ApiTags('Completion Audit')
export class CompletionAuditController {
  constructor(
    private readonly completionAuditService: CompletionAuditService
  ) {}

  @Get(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: CompletionAuditEntity,
    isArray: true,
    description: 'List all completion audits associated with an environment',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOperation({
    operationId: 'getCompletionAudit',
    summary: 'List all completion audits associated with an environment',
    description:
      'Returns a list of all completion audits associated with an environment.',
  })
  public async getAll(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @Query() query: ListAuditQueryDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<CompletionAuditEntity[]> {
    return this.completionAuditService.get(
      workspaceId,
      environmentId,
      query,
      user
    );
  }
}
