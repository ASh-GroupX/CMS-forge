import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkScaffold } from './scaffold-check.mjs';

const ignoredDirs = new Set(['.git', '.next', 'coverage', 'dist', 'node_modules']);
const jsonFiles = new Set([
  'package.json',
  '.prettierrc',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'packages/database/package.json',
  'packages/database/tsconfig.json',
  'packages/contracts/package.json',
  'packages/contracts/tsconfig.json',
  'packages/contracts/openapi.json',
  'packages/config/package.json',
  'packages/config/tsconfig.json',
  'packages/database/prisma/tsconfig.json',
  'tsconfig.base.json',
]);

function walk(root, dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirs.has(entry.name) ? [] : walk(root, fullPath);
    }
    return [relative(root, fullPath).replaceAll('\\', '/')];
  });
}

export function checkJson(root = process.cwd()) {
  const errors = [];

  for (const file of jsonFiles) {
    try {
      JSON.parse(readFileSync(join(root, file), 'utf8'));
    } catch (error) {
      errors.push(`${file}: invalid JSON (${error.message})`);
    }
  }

  return errors;
}

export function checkForbiddenImports(root = process.cwd()) {
  const errors = [];
  const sourceFiles = walk(root).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

  for (const file of sourceFiles) {
    const text = readFileSync(join(root, file), 'utf8');
    const imports = [...text.matchAll(/\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)].map(
      (match) => match[1],
    );

    for (const specifier of imports) {
      if (file.startsWith('apps/web/') && /^(?:@cms-auto\/api|@cms-auto\/database|\.\.\/api|\.\.\/\.\.\/apps\/api)/.test(specifier)) {
        errors.push(`${file}: web must not import ${specifier}`);
      }

      if (file.startsWith('apps/api/') && /^(?:@cms-auto\/web|\.\.\/web|\.\.\/\.\.\/apps\/web)/.test(specifier)) {
        errors.push(`${file}: api must not import ${specifier}`);
      }

      if (file.startsWith('packages/') && /^(?:@cms-auto\/api|@cms-auto\/web|\.\.\/\.\.\/apps\/)/.test(specifier)) {
        errors.push(`${file}: packages must not import apps (${specifier})`);
      }
    }
  }

  return errors;
}

export function lint(root = process.cwd()) {
  checkScaffold(root);
  const errors = [...checkJson(root), ...checkForbiddenImports(root)];

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  lint();
  console.log('Lint passed');
}
