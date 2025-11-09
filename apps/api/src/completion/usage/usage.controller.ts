import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiEnvironmentIdParam,
  ApiWorkspaceIdParam,
  EnvironmentIdParam,
  WorkspaceIdParam,
} from '../../common/api.decorators';
import { CompletionUsageService } from './usage.service';
import {
  CompletionUsageDimensionFilterDto,
  CompletionUsageQueryDto,
} from './dto/completion-query.dto';
import { WorkspaceMemberGuard } from '../../workspace/workspace.guard';
import { CompletionUsageQueryResultDto } from './dto/completion-query-result.dto';

@Controller('completion-usage')
@UseGuards(WorkspaceMemberGuard())
@ApiExtraModels(CompletionUsageDimensionFilterDto)
@ApiTags('Completion Usage')
export class CompletionUsageController {
  constructor(
    private readonly completionUsageService: CompletionUsageService
  ) {}

  @Post(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: CompletionUsageQueryResultDto,
    isArray: true,
    description: 'List all completion usage records',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOperation({
    operationId: 'getCompletionUsage',
    summary: 'List all completion usage records based on the query parameters',
    description:
      'Returns a list of all completion usage records, the results time gaps will be filled with null values',
  })
  public async getAll(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @Body() query: CompletionUsageQueryDto
  ): Promise<CompletionUsageQueryResultDto[]> {
    return await this.completionUsageService.query(query);
  }
}
