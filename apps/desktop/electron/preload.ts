import { contextBridge } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function safeReadJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function repoRoot(): string {
  // dev assumption: apps/desktop is CWD; repo root is two levels up
  try {
    return path.resolve(process.cwd(), '..', '..');
  } catch {
    return process.cwd();
  }
}

function listPolicyFiles(): string[] {
  const dir = path.join(repoRoot(), '.rainvibe', 'policy');
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.rego'));
  } catch {
    return [];
  }
}

contextBridge.exposeInMainWorld('rainvibe', {
  version: '0.1.0',
  orgDefaults(): any | null {
    const p = path.join(repoRoot(), '.rainvibe', 'org.json');
    return safeReadJson(p);
  },
  policyFiles(): string[] {
    return listPolicyFiles();
  },
  readReadme(): string | null {
    try {
      const p = path.join(repoRoot(), 'README.md');
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    } catch {
      return null;
    }
  },
  listDir(dir?: string): { path: string; name: string; isDir: boolean }[] {
    try {
      const base = dir ? path.resolve(repoRoot(), dir) : repoRoot();
      const entries = fs.readdirSync(base, { withFileTypes: true });
      return entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== 'build' && e.name !== 'out')
        .map(e => ({ path: path.relative(repoRoot(), path.join(base, e.name)), name: e.name, isDir: e.isDirectory() }));
    } catch {
      return [];
    }
  },
  readTextFile(relPath: string): string | null {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return null;
      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return null;
      return fs.readFileSync(abs, 'utf8');
    } catch {
      return null;
    }
  },
  writeTextFile(relPath: string, contents: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, contents, 'utf8');
      return true;
    } catch {
      return false;
    }
  }
  ,
  gitStatus(): { status: string; path: string }[] {
    try {
      const root = repoRoot();
      const out = execSync('git status --porcelain', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out.split(/\r?\n/).filter(Boolean).map(line => {
        // format: XY path
        const status = line.slice(0, 2).trim();
        const p = line.slice(3).trim();
        return { status, path: p };
      });
    } catch {
      return [];
    }
  }
  ,
  appendAudit(line: string): boolean {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'trails.jsonl');
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.appendFileSync(p, line, 'utf8');
      return true;
    } catch {
      return false;
    }
  }
});

