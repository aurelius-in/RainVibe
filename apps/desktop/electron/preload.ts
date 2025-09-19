import { contextBridge, shell } from 'electron';
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
  readPackageScripts(): string[] {
    try {
      const pkgPath = path.join(repoRoot(), 'package.json');
      if (!fs.existsSync(pkgPath)) return [];
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const json = JSON.parse(raw);
      const scripts = json?.scripts || {};
      return Object.keys(scripts);
    } catch { return []; }
  }
  ,
  searchText(term: string, dir?: string): { path: string; line: number; preview: string }[] {
    try {
      const base = dir ? path.resolve(repoRoot(), dir) : repoRoot();
      const results: { path: string; line: number; preview: string }[] = [];
      const ignore = new Set(['node_modules', 'dist', 'build', 'out']);
      const walk = (p: string, rel: string) => {
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.')) continue;
          if (ignore.has(e.name)) continue;
          const abs = path.join(p, e.name);
          const r = path.join(rel, e.name);
          if (e.isDirectory()) { walk(abs, r); continue; }
          if (!fs.existsSync(abs) || fs.statSync(abs).size > 512 * 1024) continue;
          try {
            const data = fs.readFileSync(abs, 'utf8');
            const lines = data.split(/\r?\n/);
            lines.forEach((ln, idx) => {
              if (ln.toLowerCase().includes(term.toLowerCase())) {
                results.push({ path: r.replace(/\\/g, '/'), line: idx + 1, preview: ln.trim().slice(0, 200) });
              }
            });
          } catch {}
        }
      };
      walk(base, '');
      return results;
    } catch { return []; }
  }
  ,
  writeBytesBase64(relPath: string, base64: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      const buf = Buffer.from(base64, 'base64');
      fs.writeFileSync(abs, buf);
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
  gitAdd(relPath?: string): boolean {
    try {
      const root = repoRoot();
      execSync(relPath ? `git add -- "${relPath}"` : 'git add -A', { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitCommit(message: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitCheckout(branch: string, create?: boolean): boolean {
    try {
      const root = repoRoot();
      const cmd = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
      execSync(cmd, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitStash(message?: string): boolean {
    try {
      const root = repoRoot();
      const cmd = message ? `git stash push -m ${JSON.stringify(message)}` : 'git stash push';
      execSync(cmd, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitStashList(): { name: string; message: string }[] {
    try {
      const root = repoRoot();
      const out = execSync('git stash list --pretty=%gd:%s', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out.split(/\r?\n/).filter(Boolean).map(line => {
        const idx = line.indexOf(':');
        const name = line.slice(0, idx);
        const message = line.slice(idx + 1).trim();
        return { name, message };
      });
    } catch { return []; }
  }
  ,
  gitStashApply(name: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git stash apply ${name}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitStashDrop(name: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git stash drop ${name}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitInit(): boolean {
    try {
      const root = repoRoot();
      execSync('git init', { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitRestore(relPath: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git restore -- "${relPath}"`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitShowFile(relPath: string, ref: string = 'HEAD'): string | null {
    try {
      const root = repoRoot();
      const out = execSync(`git show ${ref}:${relPath.replace(/\\/g, '/')}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out;
    } catch { return null; }
  }
  ,
  gitLog(limit: number = 20): { hash: string; author: string; date: string; subject: string }[] {
    try {
      const root = repoRoot();
      const fmt = '%H|%an|%ad|%s';
      const out = execSync(`git log -n ${limit} --date=iso --pretty=format:${fmt}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out.split(/\r?\n/).filter(Boolean).map(line => {
        const [hash, author, date, subject] = line.split('|');
        return { hash, author, date, subject };
      });
    } catch { return []; }
  }
  ,
  gitBlame(relPath: string, maxLines: number = 200): string | null {
    try {
      const root = repoRoot();
      const out = execSync(`git blame -w --line-porcelain -- "${relPath}"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      const lines = out.split(/\r?\n/).slice(0, maxLines);
      return lines.join('\n');
    } catch { return null; }
  }
  ,
  gitBranch(): string | null {
    try {
      const root = repoRoot();
      const out = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out.trim();
    } catch { return null; }
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
  ,
  clearAudit(): boolean {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'trails.jsonl');
      if (fs.existsSync(p)) fs.rmSync(p, { force: true });
      return true;
    } catch { return false; }
  }
  ,
  revealInOS(relPath: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      shell.showItemInFolder(abs);
      return true;
    } catch { return false; }
  }
  ,
  openPath(relPath: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      const res = shell.openPath(abs);
      return !!res;
    } catch { return false; }
  }
  ,
  mkdir(relPath: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      fs.mkdirSync(abs, { recursive: true });
      return true;
    } catch { return false; }
  }
  ,
  listKits(): string[] {
    try {
      const dir = path.join(repoRoot(), '.rainvibe', 'kits');
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).filter(Boolean);
    } catch { return []; }
  }
  ,
  renamePath(fromRel: string, toRel: string): boolean {
    try {
      const from = path.resolve(repoRoot(), fromRel);
      const to = path.resolve(repoRoot(), toRel);
      if (!from.startsWith(repoRoot()) || !to.startsWith(repoRoot())) return false;
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(from, to);
      return true;
    } catch { return false; }
  }
  ,
  deletePath(relPath: string): boolean {
    try {
      const abs = path.resolve(repoRoot(), relPath);
      if (!abs.startsWith(repoRoot())) return false;
      if (fs.existsSync(abs)) {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) fs.rmSync(abs, { recursive: true, force: true });
        else fs.rmSync(abs, { force: true });
      }
      return true;
    } catch { return false; }
  }
});

