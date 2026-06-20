import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = 'packages/contracts/openapi.json';
const canonicalFile = 'tools/openapi-canonical.json';

export const canonicalOpenApiText = () => readFileSync(canonicalFile, 'utf8').replace(/\r?\n?$/, '\n');

function canonicalDocument() {
  return JSON.parse(canonicalOpenApiText());
}

function requiredOperations() {
  return Object.entries(canonicalDocument().paths).flatMap(([path, operations]) =>
    Object.keys(operations).map((method) => [path, method]),
  );
}

function requiredSchemas() {
  return Object.keys(canonicalDocument().components.schemas);
}

export function checkOpenApiText(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    return [`OpenAPI document must be valid JSON (${error.message})`];
  }

  const errors = [];
  if (document.openapi !== '3.1.0') errors.push('OpenAPI document must use version 3.1.0');
  if (document.info?.title !== 'CMS-Auto API' || typeof document.info.version !== 'string') {
    errors.push('OpenAPI document must include CMS-Auto API info');
  }
  if (!document.paths || typeof document.paths !== 'object' || Array.isArray(document.paths)) {
    errors.push('OpenAPI document must include a paths object');
  }

  for (const [path, method] of requiredOperations()) {
    if (!document.paths?.[path]?.[method]) errors.push(`OpenAPI document missing ${path} ${method} operation`);
  }

  for (const schema of requiredSchemas()) {
    if (!document.components?.schemas?.[schema]) errors.push(`OpenAPI document missing ${schema} schema`);
  }

  if (text !== canonicalOpenApiText()) errors.push('OpenAPI document is not canonical; run corepack pnpm openapi:generate');
  return errors;
}

function main() {
  if (process.argv.includes('--write')) {
    writeFileSync(file, canonicalOpenApiText());
    console.log('OpenAPI scaffold generated');
    return;
  }

  const errors = checkOpenApiText(readFileSync(file, 'utf8'));
  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log('OpenAPI scaffold check passed');
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';

if (entryPath === process.argv[1]) {
  main();
}
