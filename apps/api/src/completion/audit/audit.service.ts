/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../storage/database.service';
import { CompletionAuditEntity } from './entities/audit.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { ListAuditQueryDto } from './dto/list-audit.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { CreateCompletionAuditDto } from './dto/create-audit.dto';

@Injectable()
export class CompletionAuditService {
  private buffer: { payload: CreateCompletionAuditDto; attempts?: number }[] = [];
  private flushing = false;

  constructor(
    private readonly logger: PinoLogger,
    private readonly db: DatabaseService
  ) {}

  public async get(
    workspaceId: string,
    environmentId: string,
    query: ListAuditQueryDto,
    user: UserEntity
  ): Promise<CompletionAuditEntity[]> {
    return await this.db.reader
      .selectFrom('completionAudit')
      .selectAll('completionAudit')
      .innerJoin(
        'workspaceUsers',
        'completionAudit.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('completionAudit.workspaceId', '=', workspaceId)
      .where('completionAudit.environmentId', '=', environmentId)
      .where('workspaceUsers.userId', '=', user.id)
      .$if(!!query.type, (qb) =>
        qb.where('completionAudit.type', '=', query.type!)
      )
      .$if(!!query.connectionId, (qb) =>
        qb.where('completionAudit.connectionId', '=', query.connectionId!)
      )
      .$if(!!query.resource, (qb) =>
        qb.where('completionAudit.resource', '=', query.resource!)
      )
      .$if(!!query.model, (qb) =>
        qb.where('completionAudit.model', '=', query.model!)
      )
      .$if(!!query.statusCode, (qb) =>
        qb.where('completionAudit.statusCode', '=', query.statusCode!)
      )
      .$if(!!query.startDate, (qb) =>
        qb.where('completionAudit.timestamp', '>=', query.startDate!)
      )
      .$if(!!query.endDate, (qb) =>
        qb.where('completionAudit.timestamp', '<=', query.endDate!)
      )
      .execute();
  }

  public push(payload: CreateCompletionAuditDto) {
    this.buffer.push({ payload });

    if (this.buffer.length >= 25) {
      this.flush();
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'completion-audit-flush' })
  public async flush() {
    if (this.buffer.length === 0 || this.flushing) {
      return;
    }

    this.flushing = true;
    const bufferLength = this.buffer.length;
    const transit = [...this.buffer];

    try {
      await this.db.writer
        .insertInto('completionAudit')
        .values(
          transit.map(({ payload }) => ({
            ...payload,
            data: JSON.stringify(payload.data),
            events: JSON.stringify(payload.events),
          }))
        )
        .execute();
      this.logger.info(`Flushed ${transit.length} items`);

      this.buffer.splice(0, bufferLength);
    } catch (error) {
      this.logger.error(`Failed to flush completion audit: ${error}`);
      this.buffer.splice(0, bufferLength);
      const dropItems = transit.filter(
        (item) => item.attempts && item.attempts > 3
      );
      this.logger.error(`Dropped ${dropItems.length} items`);
      const retryItems = transit.filter(
        (item) => item.attempts && item.attempts <= 3
      );
      this.buffer.push(
        ...retryItems.map((item) => ({
          ...item,
          attempts: (item.attempts || 0) + 1,
        }))
      );
      this.logger.error(`Pushed ${retryItems.length} items back to buffer`);
      this.logger.error(`Buffer now has ${this.buffer.length} items`);
    } finally {
      this.flushing = false;
    }
  }
}
