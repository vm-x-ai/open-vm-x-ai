import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Update an existing user.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
