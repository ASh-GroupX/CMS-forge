import { NestFactory } from '@nestjs/core';
import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaService } from '../../src/core/http-kernel.js';
import { SearchRepository } from '../../src/modules/search/search.repository.js';
import { SearchModule } from '../../src/modules/search/search.module.js';

test('search module resolves its runtime dependency graph', async () => {
  const onModuleInit = PrismaService.prototype.onModuleInit;
  const onModuleDestroy = PrismaService.prototype.onModuleDestroy;
  PrismaService.prototype.onModuleInit = async () => {};
  PrismaService.prototype.onModuleDestroy = async () => {};

  const app = await NestFactory.createApplicationContext(SearchModule, { logger: false });
  try {
    assert.ok(app.get(SearchRepository));
  } finally {
    await app.close();
    PrismaService.prototype.onModuleInit = onModuleInit;
    PrismaService.prototype.onModuleDestroy = onModuleDestroy;
  }
});
