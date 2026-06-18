import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const moduleNamePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function pascalCase(value) {
  return value
    .split('-')
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('');
}

function singular(value) {
  if (value.endsWith('ches') || value.endsWith('shes')) {
    return value.slice(0, -2);
  }
  if (value.endsWith('ies')) {
    return `${value.slice(0, -3)}y`;
  }
  return value.endsWith('s') ? value.slice(0, -1) : value;
}

export function moduleFiles(moduleName) {
  if (!moduleNamePattern.test(moduleName)) {
    throw new Error('Module name must be kebab-case lowercase, for example branches or complaint-status');
  }

  const classBase = pascalCase(moduleName);
  const dtoBase = pascalCase(singular(moduleName));
  const dtoFileBase = singular(moduleName);

  return new Map([
    [
      'MODULE.md',
      `# ${classBase} Module\n\n> Agent context manifest. Read this before editing the module. It defines the\n> module's boundary so you can work in a fresh context without scanning the tree.\n\n- Public surface: \`${classBase}Service\` — the only export other modules may import.\n- Owns tables: _none yet — list this module's Prisma tables here._\n- May depend on: \`core/*\` (prisma, errors, audit, rbac, correlation) and another\n  module's public service only — never its repository, \`dto/\`, or Prisma models.\n- SRS: _add the requirement IDs this module implements._\n`,
    ],
    [
      `${moduleName}.module.ts`,
      `import { ${classBase}Controller } from './${moduleName}.controller';\nimport { ${classBase}Repository } from './${moduleName}.repository';\nimport { ${classBase}Service } from './${moduleName}.service';\n\nexport class ${classBase}Module {\n  readonly controller = new ${classBase}Controller(new ${classBase}Service(new ${classBase}Repository()));\n}\n`,
    ],
    [
      `${moduleName}.controller.ts`,
      `import { ${classBase}Service } from './${moduleName}.service';\n\nexport class ${classBase}Controller {\n  constructor(private readonly ${moduleName.replaceAll('-', '')}Service: ${classBase}Service) {}\n}\n`,
    ],
    [
      `${moduleName}.service.ts`,
      `import { ${classBase}Repository } from './${moduleName}.repository';\n\nexport class ${classBase}Service {\n  constructor(private readonly ${moduleName.replaceAll('-', '')}Repository: ${classBase}Repository) {}\n}\n`,
    ],
    [
      `${moduleName}.repository.ts`,
      `export class ${classBase}Repository {}\n`,
    ],
    [
      `dto/create-${dtoFileBase}.dto.ts`,
      `export class Create${dtoBase}Dto {}\n`,
    ],
    [
      `dto/update-${dtoFileBase}.dto.ts`,
      `export class Update${dtoBase}Dto {}\n`,
    ],
    [
      `dto/${dtoFileBase}-response.dto.ts`,
      `export class ${dtoBase}ResponseDto {}\n`,
    ],
    [
      `${moduleName}.service.spec.ts`,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { ${classBase}Repository } from './${moduleName}.repository';\nimport { ${classBase}Service } from './${moduleName}.service';\n\ntest('${moduleName} service can be constructed', () => {\n  assert.ok(new ${classBase}Service(new ${classBase}Repository()));\n});\n`,
    ],
    [
      `${moduleName}.controller.spec.ts`,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { ${classBase}Controller } from './${moduleName}.controller';\nimport { ${classBase}Repository } from './${moduleName}.repository';\nimport { ${classBase}Service } from './${moduleName}.service';\n\ntest('${moduleName} controller can be constructed', () => {\n  assert.ok(new ${classBase}Controller(new ${classBase}Service(new ${classBase}Repository())));\n});\n`,
    ],
  ]);
}

export function generateModule(moduleName, root = process.cwd()) {
  const files = moduleFiles(moduleName);
  const moduleDir = join(root, 'apps/api/src/modules', moduleName);

  if (existsSync(moduleDir)) {
    throw new Error(`Module already exists: ${moduleName}`);
  }

  for (const [file] of files) {
    mkdirSync(join(moduleDir, file, '..'), { recursive: true });
  }

  for (const [file, text] of files) {
    writeFileSync(join(moduleDir, file), text);
  }

  return [...files.keys()].map((file) => `apps/api/src/modules/${moduleName}/${file}`);
}

function parseArgs(args) {
  const normalized = args.filter((arg) => arg !== '--');
  const rootIndex = normalized.indexOf('--root');
  const root = rootIndex === -1 ? process.cwd() : normalized[rootIndex + 1];
  const moduleName = normalized.find((arg, index) => arg !== '--root' && index !== rootIndex + 1);

  if (!moduleName || !root) {
    throw new Error('Usage: corepack pnpm generate:module -- <module-name> [--root <path>]');
  }

  return { moduleName, root };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { moduleName, root } = parseArgs(process.argv.slice(2));
    const files = generateModule(moduleName, root);
    console.log(`Generated ${moduleName} module skeleton:`);
    for (const file of files) {
      console.log(`- ${file}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
