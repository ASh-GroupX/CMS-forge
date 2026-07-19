import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function compileTailwind(outDir) {
  const output = join(outDir, 'proof.css');
  const result = spawnSync(
    'corepack',
    ['pnpm', '--dir', 'apps/web', 'exec', 'tailwindcss', '-c', 'tailwind.config.ts', '-i', 'src/globals.css', '-o', resolve(output), '--content', './src/**/*.{ts,tsx}'],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    throw new Error(`Tailwind proof CSS build failed\n${result.stdout}${result.stderr}`);
  }
  return output;
}

export async function runBrowserArtifactChecks(artifacts, outDir, options = {}) {
  const { chromium } = await loadPlaywrightCore();
  const axe = options.axe ? await import('@axe-core/playwright') : null;
  const browser = await chromium.launch({ headless: true });
  try {
    for (const artifact of artifacts) {
      const context = await browser.newContext({
        viewport: { width: artifact.viewport?.width ?? 1440, height: artifact.viewport?.height ?? 1100 },
      });
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(pathToFileURL(resolve(outDir, artifact.file)).href);
      await page.waitForLoadState('networkidle');

      await assertVisiblePage(page, artifact.name);
      await assertNoPageOverflow(page, artifact.name);
      await assertKeyboardPath(page, artifact.name);

      if (axe) await assertNoSeriousAxeViolations(axe.AxeBuilder, page, artifact.name);
      if (options.screenshots) {
        await page.screenshot({ fullPage: true, path: join(outDir, `${basename(artifact.file, '.html')}.png`) });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function loadPlaywrightCore() {
  try {
    return await import('playwright-core');
  } catch {
    const pnpmDir = resolve('node_modules/.pnpm');
    const packageDir = existsSync(pnpmDir)
      ? readdirSync(pnpmDir).find((entry) => entry.startsWith('playwright-core@'))
      : null;
    if (!packageDir) throw new Error('playwright-core is not available for browser proof');
    return import(pathToFileURL(join(pnpmDir, packageDir, 'node_modules/playwright-core/index.mjs')).href);
  }
}

async function assertVisiblePage(page, name) {
  const textLength = await page.locator('body').evaluate((body) => body.innerText.trim().length);
  if (textLength < 80) throw new Error(`${name} rendered blank or nearly blank in Chromium`);
}

async function assertNoPageOverflow(page, name) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  if (overflow > 2) throw new Error(`${name} has page-level horizontal overflow (${overflow}px)`);
}

async function assertKeyboardPath(page, name) {
  const focusable = page.locator('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
  if ((await focusable.count()) === 0) return;
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const active = document.activeElement;
    const styles = active ? getComputedStyle(active) : null;
    return {
      tag: active?.tagName ?? '',
      outline: styles?.outlineStyle ?? 'none',
      outlineWidth: styles?.outlineWidth ?? '0px',
      boxShadow: styles?.boxShadow ?? 'none',
    };
  });
  if (!focus.tag || focus.tag === 'BODY') throw new Error(`${name} has no keyboard focus target`);
  if (focus.outline === 'none' && focus.outlineWidth === '0px' && focus.boxShadow === 'none') {
    throw new Error(`${name} focused control has no visible focus treatment`);
  }
}

async function assertNoSeriousAxeViolations(AxeBuilder, page, name) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
  if (violations.length) {
    const details = violations.flatMap((violation) => violation.nodes.map((node) => {
      const target = node.target.join(' ');
      const summary = node.failureSummary?.replaceAll('\n', ' ') ?? node.html;
      return `${violation.id} (${violation.impact}) at ${target}: ${summary}`;
    }));
    throw new Error(`${name} has axe violations: ${details.join(' | ')}`);
  }
}
