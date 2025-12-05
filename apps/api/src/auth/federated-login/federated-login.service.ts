import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as oidcClient from 'openid-client';
import { FastifyRequest } from 'fastify';
import { throwServiceError } from '../../error';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { ErrorCode } from '../../error-code';
import { RoleService } from '../../role/role.service';

@Injectable()
export class FederatedLoginService implements OnModuleInit {
  private issuer: oidcClient.Configuration | null = null;
  private redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
    private readonly roleService: RoleService
  ) {
    this.redirectUri = `${this.configService.getOrThrow<string>(
      'BASE_URL'
    )}/interaction/federated/callback`;
  }

  async onModuleInit() {
    const issuerUrl = this.configService.get<string>('OIDC_FEDERATED_ISSUER');
    const clientId = this.configService.get<string>('OIDC_FEDERATED_CLIENT_ID');
    if (!issuerUrl || !clientId) {
      this.logger.warn('OIDC is not configured, skipping OIDC authentication');
      return;
    }

    this.issuer = await oidcClient.discovery(new URL(issuerUrl), clientId, {
      client_secret: this.configService.get<string>(
        'OIDC_FEDERATED_CLIENT_SECRET'
      ),
    });
  }

  get enabled() {
    return this.issuer !== null;
  }

  async getAuthorizationUrl(interactionId: string) {
    if (!this.issuer) {
      throwServiceError(HttpStatus.BAD_REQUEST, ErrorCode.OIDC_NOT_CONFIGURED);
    }
    const codeVerifier = await oidcClient.randomPKCECodeVerifier();
    const codeChallenge = await oidcClient.calculatePKCECodeChallenge(
      codeVerifier
    );

    const state = interactionId;
    const parameters: Record<string, string> = {
      redirect_uri: this.redirectUri,
      scope: this.configService.getOrThrow<string>('OIDC_FEDERATED_SCOPE'),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    };

    const url = oidcClient.buildAuthorizationUrl(this.issuer, parameters);
    return { url, codeVerifier };
  }

  async callback(
    request: FastifyRequest<{
      Querystring: {
        state: string | undefined;
      };
    }>,
    pkceCodeVerifier: string
  ): Promise<UserEntity> {
    if (!this.issuer) {
      throw new BadRequestException('OIDC is not configured');
    }

    const state = request.query?.state;
    if (!state) {
      throw new BadRequestException('State is required');
    }

    const query = new URLSearchParams(request.query as Record<string, string>);

    const currentUrl = new URL(`${this.redirectUri}?${query.toString()}`);

    try {
      const tokens = await oidcClient.authorizationCodeGrant(
        this.issuer,
        currentUrl,
        {
          expectedState: state,
          pkceCodeVerifier,
        }
      );

      const claims = tokens.claims();
      if (!claims) {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.OIDC_CLAIMS_NOT_AVAILABLE
        );
      }

      const user = await this.usersService.createOidcUser(claims);
      const defaultRole = await this.roleService.getByName(
        this.configService.getOrThrow<string>('OIDC_FEDERATED_DEFAULT_ROLE')
      );

      if (defaultRole) {
        await this.roleService.assignUsersToRole(
          defaultRole.roleId,
          {
            userIds: [user.id],
          },
          user
        );
      }
      return user;
    } catch (error) {
      if (error instanceof oidcClient.ResponseBodyError) {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.OIDC_RESPONSE_ERROR,
          { error: error.error }
        );
      }
      throw error;
    }
  }
}
