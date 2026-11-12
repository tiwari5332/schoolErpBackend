import app from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { LateFeeSweepJob } from './jobs/lateFeeSweep.job';
import { Logger } from './libs/logger';
import { initDatabaseSchema } from './config/initDb';

const server = app.listen(env.PORT, () => {
  Logger.info(`🚀 School ERP Node.js Server running on port ${env.PORT}`, {
    port: env.PORT,
    environment: env.NODE_ENV,
  });

  // Initialize schema & seeds in background
  initDatabaseSchema().catch((err) => {
    Logger.error('Database schema init error on startup', { error: err.message });
  });

  // Start scheduled cron jobs
  LateFeeSweepJob.schedule();
});

const gracefulShutdown = async () => {
  Logger.info('Shutting down server gracefully...');
  server.close(async () => {
    await pool.end();
    Logger.info('PostgreSQL pool closed. Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
