import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsString, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PolicyExampleDto {
  @ApiProperty({
    description: 'The value of the policy example',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'The description of the policy example',
  })
  @IsString()
  @IsNotEmpty()
  description?: string;
}

export class ModulePermissionsDto {
  @ApiProperty({
    description: 'The name of the module',
    example: 'workspace',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The actions of the module',
    example: [
      'workspace:list',
      'workspace:create',
      'workspace:update',
      'workspace:delete',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  actions: string[];

  @ApiProperty({
    description: 'The base resource of the module',
    example: 'workspace:${workspace.name}',
  })
  @IsString()
  @IsNotEmpty()
  baseResource: string;

  @ApiProperty({
    description: 'The item resource of the module',
    example:
      'workspace:${workspace.name}:environment:${environment.name}:ai-connection:${ai-connection.name}',
  })
  @IsString()
  @IsNotEmpty()
  itemResource: string;

  @ApiProperty({
    description: 'The policy example of the module',
  })
  @IsObject()
  @IsOptional()
  policyExample?: PolicyExampleDto;
}
export class PermissionsDto {
  @ApiProperty({
    description: 'All available actions for each module',
    type: [ModulePermissionsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionsDto)
  modules: ModulePermissionsDto[];
}
