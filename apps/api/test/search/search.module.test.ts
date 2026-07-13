import { MODULE_METADATA } from '@nestjs/common/constants.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../src/core/auth.guard.js';
import { PrismaService } from '../../src/core/http-kernel.js';
import { AuthModule } from '../../src/modules/auth/auth.module.js';
import { SearchModule } from '../../src/modules/search/search.module.js';

test('search module wires its database and authentication dependencies', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, SearchModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, SearchModule) as unknown[];

  assert.ok(imports.includes(AuthModule));
  assert.ok(providers.includes(PrismaService));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(PermissionGuard));
  assert.ok(providers.some((provider) => (provider as { provide?: unknown }).provide === SESSION_AUTH_SERVICE));
});
