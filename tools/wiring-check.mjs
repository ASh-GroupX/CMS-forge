import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const apiSrc = 'apps/api/src';
const rootModuleFile = `${apiSrc}/main.ts`;

// Ratchet of documented runtime debt. It may only SHRINK: a NEW orphaned module must
// fail this gate, never be added here. Remove an entry the moment its module is wired in.
const knownUnwiredModules = new Set([]);

function walkFiles(root, dir, acc) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      walkFiles(root, rel, acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

function moduleImports(text) {
  const match = text.match(/imports\s*:\s*\[([^\]]*)\]/);
  return match
    ? match[1].split(',').map((entry) => entry.trim()).filter((entry) => /^[A-Z]\w*Module$/.test(entry))
    : [];
}

// Every module on disk must be reachable from the runtime AppModule graph in main.ts. A
// module imported by nobody is dead at runtime - the failure a shape-only MODULE.md check
// cannot see. Composition is fully static (plain imports, no forwardRef/dynamic modules),
// so static reachability equals the real runtime graph. When a scheduler or dynamic
// modules are introduced, add a boot-time check for job/route registration.
export function checkModuleWiring(root = process.cwd(), knownUnwired = knownUnwiredModules) {
  if (!existsSync(join(root, apiSrc)) || !existsSync(join(root, rootModuleFile))) {
    return [];
  }

  const diskModules = new Map();
  const graph = new Map();
  for (const file of walkFiles(root, apiSrc, [])) {
    const inModule = /^apps\/api\/src\/modules\/[^/]+\/[^/]+\.module\.ts$/.test(file);
    if (!inModule && file !== rootModuleFile) {
      continue;
    }
    const text = readFileSync(join(root, file), 'utf8');
    const declared = text.match(/class (\w+Module)\b/);
    if (!declared) {
      continue;
    }
    graph.set(declared[1], moduleImports(text));
    const folder = file.match(/^apps\/api\/src\/modules\/([^/]+)\//);
    if (folder) {
      diskModules.set(declared[1], folder[1]);
    }
  }

  const rootDeclared = readFileSync(join(root, rootModuleFile), 'utf8').match(/class (\w+Module)\b/);
  if (!rootDeclared) {
    return [`${rootModuleFile}: no AppModule found to verify module wiring`];
  }

  const reachable = new Set();
  const stack = [rootDeclared[1]];
  while (stack.length > 0) {
    for (const dep of graph.get(stack.pop()) ?? []) {
      if (!reachable.has(dep)) {
        reachable.add(dep);
        stack.push(dep);
      }
    }
  }

  const errors = [];
  for (const [moduleClass, folder] of diskModules) {
    if (reachable.has(moduleClass) || knownUnwired.has(folder)) {
      continue;
    }
    errors.push(
      `apps/api/src/modules/${folder}: ${moduleClass} is not wired into the ${rootDeclared[1]} graph (orphaned module, dead at runtime)`,
    );
  }
  for (const folder of knownUnwired) {
    if ([...diskModules].some(([moduleClass, name]) => name === folder && reachable.has(moduleClass))) {
      errors.push(`tools/wiring-check.mjs knownUnwiredModules: "${folder}" is wired now - remove it from the allowlist`);
    }
  }

  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkModuleWiring();
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('Module wiring check passed');
}
