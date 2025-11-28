import { Strategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { OidcProviderService } from '../provider/oidc-provider.service';
import { UsersService } from '../../users/users.service';
import type { AccessToken } from 'oidc-provider';
import { UserEntity } from '../../users/entities/user.entity';

export type PassportResult = AccessToken & {
  user: UserEntity;
};

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private readonly oidcProvider: OidcProviderService,
    private readonly usersService: UsersService
  ) {
    super();
  }

  async validate(token: string): Promise<PassportResult | null> {
    const accessToken = await this.oidcProvider.provider.AccessToken.find(
      token
    );
    if (!accessToken) return null;

    const user = await this.usersService.getById(accessToken.accountId);
    if (!user) return null;

    const { passwordHash, ...rest } = user;
    return {
      ...accessToken,
      user: rest,
    } as PassportResult;
  }
}
