import {
  applyDecorators,
  DefaultValuePipe,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

export function ApiIncludesUsersQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'includesUsers',
      type: Boolean,
      required: false,
      description: 'Whether to include users in the response',
    })
  );
}

export function ApiWorkspaceIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'workspaceId',
      type: String,
      required: true,
      description: 'The ID of the workspace',
    })
  );
}

export function ApiEnvironmentIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'environmentId',
      type: String,
      required: true,
      description: 'The ID of the environment',
    })
  );
}

export function IncludesUsersQuery() {
  return Query(
    'includesUsers',
    new DefaultValuePipe(true),
    new ParseBoolPipe({ optional: true })
  );
}

export function WorkspaceIdParam() {
  return Param('workspaceId', new ParseUUIDPipe({ version: '4' }));
}

export function EnvironmentIdParam() {
  return Param('environmentId', new ParseUUIDPipe({ version: '4' }));
}
