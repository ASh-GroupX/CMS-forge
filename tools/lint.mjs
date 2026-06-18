import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkScaffold } from './scaffold-check.mjs';

const ignoredDirs = new Set(['.git', '.next', 'coverage', 'dist', 'node_modules']);
const maxAgenticFileLines = 300;
const agenticFileSizeExemptions = new Set(['packages/database/prisma/schema.prisma']);
// Each backend module ships an agent context manifest so a fresh-context agent can
// load only that module's boundary. These fields must be documented in it.
const manifestRequiredFields = [
  ['Public surface', /public surface/i],
  ['Owns tables', /owns tables/i],
  ['May depend on', /may depend on/i],
  ['SRS', /\bSRS\b/i],
];
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
    const moduleMatch = file.match(/^apps\/api\/src\/modules\/([^/]+)\//);

    for (const specifier of imports) {
      if (
        file.startsWith('apps/web/') &&
        /^(?:@cms-auto\/api|@cms-auto\/database|@prisma\/client|prisma|aws-sdk|@aws-sdk\/|twilio|nodemailer|\.\.\/api|\.\.\/database|\.\.\/\.\.\/apps\/api|\.\.\/\.\.\/packages\/database)/.test(
          specifier,
        )
      ) {
        errors.push(`${file}: web must not import ${specifier}`);
      }

      if (file.startsWith('apps/api/') && /^(?:@cms-auto\/web|\.\.\/web|\.\.\/\.\.\/apps\/web)/.test(specifier)) {
        errors.push(`${file}: api must not import ${specifier}`);
      }

      if (file.startsWith('packages/') && /^(?:@cms-auto\/api|@cms-auto\/web|\.\.\/\.\.\/apps\/)/.test(specifier)) {
        errors.push(`${file}: packages must not import apps (${specifier})`);
      }

      if (moduleMatch) {
        const currentModule = moduleMatch[1];
        const otherModule =
          specifier.match(/^@cms-auto\/api\/src\/modules\/([^/]+)\/(.+)$/) ??
          specifier.match(/^(?:\.\.\/)+([^/]+)\/(.+)$/);
        if (otherModule && otherModule[1] !== currentModule && /(?:\.repository|^dto\/|\/dto\/|prisma)/.test(otherModule[2])) {
          errors.push(`${file}: module must not import another module private API (${specifier})`);
        }
      }
    }
  }

  return errors;
}

export function checkForbiddenMarkers(root = process.cwd()) {
  const checkedFiles = walk(root).filter(
    (file) =>
      /^(?:apps|packages)\//.test(file) &&
      /\.(?:ts|tsx|js|mjs|css|prisma)$/.test(file) &&
      !file.includes('/migrations/'),
  );

  return checkedFiles.flatMap((file) => {
    const text = readFileSync(join(root, file), 'utf8');
    return /\b(?:TODO|FIXME)\b/.test(text) ? [`${file}: TODO/FIXME markers are not allowed`] : [];
  });
}

// Line count is a crude proxy for complexity, so the budget is generous and tests
// and DTO/type files are exempt: padding them out is healthy, not a smell. The goal
// is catching a logic file that has grown past what an agent can hold in context.
function isAgenticSizeExempt(file) {
  return (
    agenticFileSizeExemptions.has(file) ||
    file.includes('/migrations/') ||
    /\.(?:spec|test)\.(?:ts|tsx|mjs|js)$/.test(file) ||
    /\.dto\.ts$/.test(file)
  );
}

export function checkAgenticFileSize(root = process.cwd()) {
  const checkedFiles = walk(root).filter(
    (file) =>
      /^(?:apps|packages|tools)\//.test(file) &&
      /\.(?:ts|tsx|js|mjs|css|prisma)$/.test(file) &&
      !isAgenticSizeExempt(file),
  );

  return checkedFiles.flatMap((file) => {
    const text = readFileSync(join(root, file), 'utf8').replace(/\r?\n$/, '');
    const lineCount = text === '' ? 0 : text.split(/\r?\n/).length;
    return lineCount > maxAgenticFileLines
      ? [`${file}: ${lineCount} lines exceeds agentic file budget (${maxAgenticFileLines})`]
      : [];
  });
}

// Every backend module directory must carry a MODULE.md manifest documenting its
// public surface, owned tables, allowed dependencies, and SRS IDs. This lets an
// agent work on one module from a fresh context without scanning the whole tree.
export function checkModuleManifests(root = process.cwd()) {
  const modules = new Map();
  for (const file of walk(root)) {
    const match = file.match(/^apps\/api\/src\/modules\/([^/]+)\//);
    if (match) {
      if (!modules.has(match[1])) {
        modules.set(match[1], new Set());
      }
      modules.get(match[1]).add(file);
    }
  }

  const errors = [];
  for (const [name, files] of modules) {
    const manifest = `apps/api/src/modules/${name}/MODULE.md`;
    if (!files.has(manifest)) {
      errors.push(`apps/api/src/modules/${name}: missing MODULE.md agent context manifest`);
      continue;
    }
    const text = readFileSync(join(root, manifest), 'utf8');
    for (const [label, pattern] of manifestRequiredFields) {
      if (!pattern.test(text)) {
        errors.push(`${manifest}: manifest must document "${label}"`);
      }
    }
  }

  return errors;
}

export function lint(root = process.cwd()) {
  checkScaffold(root);
  const errors = [
    ...checkJson(root),
    ...checkForbiddenImports(root),
    ...checkForbiddenMarkers(root),
    ...checkAgenticFileSize(root),
    ...checkModuleManifests(root),
  ];

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  lint();
  console.log('Lint passed');
}
