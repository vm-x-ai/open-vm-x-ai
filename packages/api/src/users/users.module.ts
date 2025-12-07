import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RoleModule } from '../role/role.module';
import { PasswordService } from '../auth/password.service';

@Module({
  imports: [RoleModule],
  controllers: [UsersController],
  providers: [UsersService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
