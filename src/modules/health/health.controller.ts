import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../infra/db/prisma.service';
import { RedisService } from '../../infra/cache/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get('live')
  live() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async ready() {
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    try {
      const client = this.redis.getClient();
      if (client) {
        await client.ping();
      } else {
        redisStatus = 'down';
      }
    } catch {
      redisStatus = 'down';
    }

    const isHealthy = dbStatus === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

