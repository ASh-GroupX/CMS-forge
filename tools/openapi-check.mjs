import { readFileSync } from 'node:fs';

const document = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));

if (document.openapi !== '3.1.0') {
  throw new Error('OpenAPI document must use version 3.1.0');
}

if (document.info?.title !== 'CMS-Auto API' || typeof document.info.version !== 'string') {
  throw new Error('OpenAPI document must include CMS-Auto API info');
}

if (!document.paths || typeof document.paths !== 'object' || Array.isArray(document.paths)) {
  throw new Error('OpenAPI document must include a paths object');
}

console.log('OpenAPI scaffold check passed');
