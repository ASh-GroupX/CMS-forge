import assert from 'node:assert/strict';
import test from 'node:test';
import { CommunicationGroupsController } from './communication-groups.controller.js';
import { CommunicationGroupsRepository } from './communication-groups.repository.js';
import { CommunicationGroupsService } from './communication-groups.service.js';
import { AuditService } from '../../core/audit.service.js';

test('communication-groups controller can be constructed', () => {
  assert.ok(new CommunicationGroupsController(new CommunicationGroupsService(new CommunicationGroupsRepository({} as never), new AuditService({} as never))));
});
