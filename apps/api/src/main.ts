import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AppExceptionFilter,
  PrismaService,
  correlationMiddleware,
} from './core/http-kernel.js';

@Controller()
class HealthController {
  @Get()
  root(): Record<string, boolean | string> {
    return this.health();
  }

  @Get('health')
  health(): Record<string, boolean | string> {
    return {
      status: 'ok',
      service: 'api',
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      redisConfigured: Boolean(process.env.REDIS_URL),
    };
  }
}

@Module({
  controllers: [HealthController],
  providers: [PrismaService],
})
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(correlationMiddleware);
  app.useGlobalFilters(new AppExceptionFilter());
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
