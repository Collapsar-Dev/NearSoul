import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { loadEnv } from './config/env';
import { logger } from './common/logging';

async function main() {
  const env = loadEnv(); // fail fast on invalid configuration
  const app = await NestFactory.create(AppModule, { logger: env.APP_ENV === 'test' ? false : ['log', 'warn', 'error'] });
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(env.PORT, '0.0.0.0');
  logger.info({ msg: 'NearSoul API listening', port: env.PORT, env: env.APP_ENV });
}

void main();
