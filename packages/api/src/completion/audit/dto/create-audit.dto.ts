import { OmitType } from '@nestjs/mapped-types';
import { CompletionAuditEntity } from '../entities/audit.entity';

export class CreateCompletionAuditDto extends OmitType(CompletionAuditEntity, [
  'id',
]) {}
