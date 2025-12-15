import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cluster, ClusterOptions, RedisOptions } from 'ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisClient {
  public client: Cluster | Redis;
  public streamClient: Cluster | Redis;

  constructor(private readonly configService: ConfigService) {
    const redisTLS = this.configService.getOrThrow<boolean>('REDIS_TLS');
    const redisOptions: RedisOptions | undefined = redisTLS
      ? {
          tls: {
            rejectUnauthorized: false,
          },
          connectTimeout: 2000,
        }
      : undefined;

    const redisMode = this.configService.getOrThrow<'single' | 'cluster'>(
      'REDIS_MODE'
    );

    if (redisMode === 'cluster') {
      const redisClusterNodes = [
        {
          host: this.configService.getOrThrow<string>('REDIS_HOST'),
          port: this.configService.getOrThrow<number>('REDIS_PORT'),
        },
      ];

      const clusterOptions: ClusterOptions = {
        redisOptions: {
          ...redisOptions,
          connectTimeout: 10000,
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        },
        enableReadyCheck: true,
        slotsRefreshTimeout: 10000,
        dnsLookup: (address, callback) => callback(null, address),
      };

      this.client = new Redis.Cluster(redisClusterNodes, clusterOptions);
      this.streamClient = new Redis.Cluster(redisClusterNodes, clusterOptions);
    } else if (redisMode === 'single') {
      this.client = new Redis({
        host: this.configService.getOrThrow<string>('REDIS_HOST'),
        port: this.configService.getOrThrow<number>('REDIS_PORT'),
      });

      this.streamClient = new Redis({
        host: this.configService.getOrThrow<string>('REDIS_HOST'),
        port: this.configService.getOrThrow<number>('REDIS_PORT'),
      });
    }
  }
}
