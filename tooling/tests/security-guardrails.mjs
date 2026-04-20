import { promises as fs } from 'node:fs';
import path from 'node:path';

const workspaceRoot = path.resolve(process.cwd(), '..');

const filesToScan = [
  path.join(workspaceRoot, 'index.html'),
  path.join(workspaceRoot, 'app', 'dist', 'index.html'),
];

const dirsToScan = [
  path.join(workspaceRoot, 'app', 'pages'),
  path.join(workspaceRoot, 'app', 'src'),
  path.join(workspaceRoot, 'app', 'dist', 'assets'),
];

const allowedExtensions = new Set(['.html', '.js', '.mjs']);
const bannedOrigins = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
];

const allowedStorageKeys = new Set([
  'delphiRiseSignatureInfo',
  'internData',
  'autoCheckInternNote',
]);

const strictScriptCspFiles = [
  path.join(workspaceRoot, 'index.html'),
  path.join(workspaceRoot, 'app', 'pages', 'letters.html'),
  path.join(workspaceRoot, 'app', 'pages', 'qr.html'),
];

const inlineHandlerPattern = /\son(?:click|input|change|mouseenter|mouseleave)\s*=/i;

async function collectFiles(dirPath, results) {
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor' || entry.name === 'node_modules') {
        continue;
      }
      await collectFiles(fullPath, results);
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath).replaceAll('\\', '/');
}

function findBannedOrigins(content) {
  return bannedOrigins.filter((origin) => content.includes(origin));
}

function findStorageViolations(content) {
  const violations = [];
  const staticKeyPattern = /(localStorage|sessionStorage)\.setItem\(\s*['"`]([^'"`]+)['"`]/g;

  for (const match of content.matchAll(staticKeyPattern)) {
    const storageType = match[1];
    const key = match[2];
    if (!allowedStorageKeys.has(key)) {
      violations.push(`${storageType}.setItem('${key}')`);
    }
  }

  return violations;
}

function hasUnsafeInlineScriptCsp(content) {
  const cspMetaPattern = /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=["']([^"']+)["']/i;
  const match = content.match(cspMetaPattern);
  if (!match) {
    return false;
  }
  const policy = match[1];
  return /script-src[^;]*'unsafe-inline'/i.test(policy);
}

function hasInlineHandlers(content) {
  return inlineHandlerPattern.test(content);
}

async function main() {
  const allFiles = [...filesToScan];
  for (const dirPath of dirsToScan) {
    await collectFiles(dirPath, allFiles);
  }

  const problems = [];

  for (const filePath of allFiles) {
    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    const blockedOrigins = findBannedOrigins(content);
    if (blockedOrigins.length > 0) {
      problems.push(`${relative(filePath)} uses banned external origins: ${blockedOrigins.join(', ')}`);
    }

    const storageViolations = findStorageViolations(content);
    if (storageViolations.length > 0) {
      problems.push(`${relative(filePath)} uses disallowed browser storage keys: ${storageViolations.join(', ')}`);
    }

    if (strictScriptCspFiles.includes(filePath)) {
      if (hasUnsafeInlineScriptCsp(content)) {
        problems.push(`${relative(filePath)} allows 'unsafe-inline' in script-src CSP`);
      }
      if (hasInlineHandlers(content)) {
        problems.push(`${relative(filePath)} contains inline DOM event handlers`);
      }
    }
  }

  if (problems.length > 0) {
    console.error('Security guardrail failures:');
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    process.exit(1);
  }

  console.log(`Security guardrails passed for ${allFiles.length} files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
