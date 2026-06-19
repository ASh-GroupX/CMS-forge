import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

const modulesRoot = 'apps/api/src/modules';
const schemaFile = 'packages/database/prisma/schema.prisma';

function walk(root, dir, acc = []) {
  if (!existsSync(join(root, dir))) {
    return acc;
  }
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      walk(root, rel, acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

function pascal(name) {
  return name.split('-').map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join('');
}

function section(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading}\\s*$`, 'i').test(line));
  if (start === -1) return '';
  const body = [];
  for (let index = start + 1; index < lines.length && !/^##\s+/.test(lines[index]); index += 1) {
    body.push(lines[index]);
  }
  return body.join('\n');
}

function importSpecifiers(text) {
  return [...text.matchAll(/\bimport\s+(?:type\s+)?(?:[^'\"]+\s+from\s+)?['\"]([^'\"]+)['\"]/g)].map((match) => match[1]);
}

function crossModuleFromSpecifier(file, specifier) {
  const absoluteMatch = specifier.match(/^@cms-auto\/api\/src\/modules\/([^/]+)\//);
  if (absoluteMatch) {
    return absoluteMatch[1];
  }
  if (!specifier.startsWith('.')) {
    return null;
  }
  const resolved = posix.normalize(posix.join(dirname(file), specifier.replace(/\.js$/, '.ts')));
  const match = resolved.match(/^apps\/api\/src\/modules\/([^/]+)\//);
  return match?.[1] ?? null;
}

function declaredModule(manifest, dependency) {
  const mayDependOn = section(manifest, 'May depend on') || manifest;
  const name = pascal(dependency);
  return new RegExp(`\\b(?:modules/${dependency}|${name}Module|${name}Service)\\b`, 'i').test(mayDependOn);
}

function prismaModelMap(schema) {
  const map = new Map();
  for (const match of schema.matchAll(/^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm)) {
    const model = match[1];
    const body = match[2];
    const mapped = body.match(/@@map\("([^"]+)"\)/)?.[1];
    const delegate = `${model[0].toLowerCase()}${model.slice(1)}`;
    map.set(delegate, mapped ?? delegate);
    map.set(model, mapped ?? delegate);
  }
  return map;
}

function declaredTables(manifest) {
  const owns = section(manifest, 'Owns tables') || (manifest.match(/Owns tables:[^\n]+/i)?.[0] ?? '');
  return new Set([...owns.matchAll(/`([a-z][a-z0-9_]+)`|\b([a-z][a-z0-9_]+)\b/g)].map((match) => match[1] ?? match[2]));
}

function usedTables(root, moduleName, modelMap) {
  const tables = new Set();
  for (const file of walk(root, `${modulesRoot}/${moduleName}`).filter((entry) => entry.endsWith('.repository.ts'))) {
    const text = readFileSync(join(root, file), 'utf8');
    for (const match of text.matchAll(/\b(?:this\.prisma|client)\.(\w+)\b/g)) {
      if (modelMap.has(match[1])) tables.add(modelMap.get(match[1]));
    }
    for (const match of text.matchAll(/Pick<Prisma(?:Service|\.TransactionClient),\s*([^>]+)>/g)) {
      for (const delegate of match[1].matchAll(/'([a-z]\w+)'/g)) {
        if (modelMap.has(delegate[1])) tables.add(modelMap.get(delegate[1]));
      }
    }
    for (const match of text.matchAll(/Prisma\.(\w+?)(?:Select|GetPayload)\b/g)) {
      if (modelMap.has(match[1])) tables.add(modelMap.get(match[1]));
    }
  }
  return tables;
}

export function checkManifestTruth(root = process.cwd()) {
  if (!existsSync(join(root, modulesRoot))) {
    return [];
  }
  const modelMap = existsSync(join(root, schemaFile)) ? prismaModelMap(readFileSync(join(root, schemaFile), 'utf8')) : new Map();
  const errors = [];

  for (const manifestFile of walk(root, modulesRoot).filter((file) => file.endsWith('/MODULE.md'))) {
    const moduleName = manifestFile.match(/^apps\/api\/src\/modules\/([^/]+)\/MODULE\.md$/)?.[1];
    if (!moduleName) continue;
    const manifest = readFileSync(join(root, manifestFile), 'utf8');

    const actualDeps = new Set();
    for (const file of walk(root, `${modulesRoot}/${moduleName}`).filter((entry) => entry.endsWith('.ts'))) {
      const text = readFileSync(join(root, file), 'utf8');
      for (const specifier of importSpecifiers(text)) {
        const dependency = crossModuleFromSpecifier(file, specifier);
        if (dependency && dependency !== moduleName) actualDeps.add(dependency);
      }
    }
    for (const dependency of actualDeps) {
      if (!declaredModule(manifest, dependency)) {
        errors.push(`${manifestFile}: May depend on must declare modules/${dependency} used by imports`);
      }
    }

    const declared = declaredTables(manifest);
    for (const table of usedTables(root, moduleName, modelMap)) {
      if (!declared.has(table)) {
        errors.push(`${manifestFile}: Owns tables must declare Prisma table "${table}" used by repository`);
      }
    }
  }

  return errors;
}
