import { Logger } from '@nestjs/common';
import { bootstrapServer } from './server';
import { env } from './config/env.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await bootstrapServer();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`🚀 EduTrio API Server is listening on http://localhost:${env.PORT}/api/v1`);
}

bootstrap();
