import { contextBridge, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';

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
  orgMtime(): number | null {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'org.json');
      if (!fs.existsSync(p)) return null;
      const stat = fs.statSync(p);
      return stat.mtimeMs;
    } catch { return null; }
  }
  ,
  loadPrompt(name: string): string | null {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'prompts', `${name}.md`);
      if (!fs.existsSync(p)) return null;
      return fs.readFileSync(p, 'utf8');
    } catch { return null; }
  }
  ,
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
  gitDiff(relPath: string, refA: string = 'HEAD', refB?: string): string | null {
    try {
      const root = repoRoot();
      const spec = refB ? `${refA}..${refB}` : `${refA}`;
      const out = execSync(`git --no-pager diff ${spec} -- "${relPath}"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out;
    } catch { return null; }
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
  gitShowCommit(hash: string): string | null {
    try {
      const root = repoRoot();
      const out = execSync(`git --no-pager show --stat --name-status ${hash}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      return out;
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
  installKit(name: string, readme?: string): boolean {
    try {
      const dir = path.join(repoRoot(), '.rainvibe', 'kits', name);
      fs.mkdirSync(dir, { recursive: true });
      if (readme) fs.writeFileSync(path.join(dir, 'README.md'), readme, 'utf8');
      return true;
    } catch { return false; }
  }
  ,
  removeKit(name: string): boolean {
    try {
      const dir = path.join(repoRoot(), '.rainvibe', 'kits', name);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      return true;
    } catch { return false; }
  }
  ,
  saveSecret(key: string, value: string): boolean {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'secrets.json');
      const obj = safeReadJson(p) || {};
      obj[key] = value;
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
      return true;
    } catch { return false; }
  }
  ,
  loadSecret(key: string): string | null {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'secrets.json');
      if (!fs.existsSync(p)) return null;
      const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
      return obj[key] ?? null;
    } catch { return null; }
  }
  ,
  deleteSecret(key: string): boolean {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'secrets.json');
      if (!fs.existsSync(p)) return true;
      const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
      delete obj[key];
      fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
      return true;
    } catch { return false; }
  }
  ,
  updateKit(name: string, note?: string): boolean {
    try {
      const dir = path.join(repoRoot(), '.rainvibe', 'kits', name);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const p = path.join(dir, 'README.md');
      const prev = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
      const next = (prev ? prev + '\n\n' : '') + (note || `Updated at ${new Date().toISOString()}`);
      fs.writeFileSync(p, next, 'utf8');
      return true;
    } catch { return false; }
  }
  ,
  buildIndex(): number {
    try {
      const root = repoRoot();
      const idxPath = path.join(root, '.rainvibe', 'index.json');
      const files: Array<{ path: string; size: number }> = [];
      const ignore = new Set(['node_modules','dist','build','out']);
      const walk = (p: string, rel: string) => {
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.')) continue;
          if (ignore.has(e.name)) continue;
          const abs = path.join(p, e.name);
          const r = path.join(rel, e.name).replace(/\\/g,'/');
          if (e.isDirectory()) { walk(abs, r); continue; }
          const stat = fs.statSync(abs);
          if (stat.size > 1024*1024) continue;
          files.push({ path: r, size: stat.size });
        }
      };
      walk(root, '');
      fs.mkdirSync(path.dirname(idxPath), { recursive: true });
      fs.writeFileSync(idxPath, JSON.stringify({ ts: Date.now(), files }, null, 2), 'utf8');
      return files.length;
    } catch { return 0; }
  }
  ,
  searchIndex(term: string): { path: string; line: number; preview: string }[] {
    try {
      const root = repoRoot();
      const idxPath = path.join(root, '.rainvibe', 'index.json');
      if (!fs.existsSync(idxPath)) return [];
      const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
      const out: { path: string; line: number; preview: string }[] = [];
      for (const f of idx.files || []) {
        const abs = path.join(root, f.path);
        try {
          const data = fs.readFileSync(abs, 'utf8');
          const lines = data.split(/\r?\n/);
          lines.forEach((ln, i) => { if (ln.toLowerCase().includes(term.toLowerCase())) out.push({ path: f.path, line: i+1, preview: ln.trim().slice(0, 200) }); });
        } catch {}
      }
      return out;
    } catch { return []; }
  }
  ,
  indexSymbols(): number {
    try {
      const root = repoRoot();
      const outPath = path.join(root, '.rainvibe', 'symbols.json');
      const symbols: Array<{ path: string; line: number; name: string; kind: string }> = [];
      const ignore = new Set(['node_modules','dist','build','out']);
      const rx = /(class\s+(\w+))|(function\s+(\w+))|(const\s+(\w+)\s*=\s*\()/;
      const walk = (p: string, rel: string) => {
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.')) continue;
          if (ignore.has(e.name)) continue;
          const abs = path.join(p, e.name);
          const r = path.join(rel, e.name).replace(/\\/g,'/');
          if (e.isDirectory()) { walk(abs, r); continue; }
          if (!/\.(t|j)sx?$/.test(e.name)) continue;
          try {
            const data = fs.readFileSync(abs, 'utf8');
            const lines = data.split(/\r?\n/);
            lines.forEach((ln, i) => {
              const m = rx.exec(ln);
              if (m) {
                const name = m[2] || m[4] || m[6] || '';
                const kind = m[2] ? 'class' : m[4] ? 'function' : 'const';
                if (name) symbols.push({ path: r, line: i+1, name, kind });
              }
            });
          } catch {}
        }
      };
      walk(root, '');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify({ ts: Date.now(), symbols }, null, 2), 'utf8');
      return symbols.length;
    } catch { return 0; }
  }
  ,
  searchSymbols(term: string): { path: string; line: number; name: string; kind: string }[] {
    try {
      const root = repoRoot();
      const outPath = path.join(root, '.rainvibe', 'symbols.json');
      if (!fs.existsSync(outPath)) return [];
      const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      const t = term.toLowerCase();
      return (data.symbols || []).filter((s: any) => String(s.name || '').toLowerCase().includes(t));
    } catch { return []; }
  }
  ,
  policyHints(): string[] {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'policy', 'hints.json');
      if (!fs.existsSync(p)) return [];
      const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  ,
  loadPolicyRules(): Array<{ name: string; pattern: string; message?: string }> {
    try {
      const p = path.join(repoRoot(), '.rainvibe', 'policy', 'rules.json');
      if (!fs.existsSync(p)) return [];
      const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  ,
  policyCheckFiles(files: string[]): { file: string; line: number; message: string }[] {
    const out: { file: string; line: number; message: string }[] = [];
    try {
      const root = repoRoot();
      const rules = (this as any).loadPolicyRules?.() || [];
      const defaults = rules.length ? [] : [
        { name: 'no_select_all', pattern: '(?i)SELECT\s+\*', message: 'Disallow SELECT * in SQL' },
        { name: 'no_var', pattern: '\\bvar\\b', message: 'Avoid var, use let/const' },
      ];
      const regs = (rules.length ? rules : defaults).map((r: any) => ({ re: new RegExp(r.pattern, 'g'), message: r.message || r.name }));
      for (const rel of files) {
        const abs = path.join(root, rel);
        if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
        let data = '';
        try { data = fs.readFileSync(abs, 'utf8'); } catch { continue; }
        const lines = data.split(/\r?\n/);
        lines.forEach((ln, idx) => {
          regs.forEach(({ re, message }) => {
            if (re.test(ln)) out.push({ file: rel, line: idx + 1, message });
            re.lastIndex = 0;
          });
        });
      }
    } catch {}
    return out;
  }
  ,
  policyCheckChanged(): { file: string; line: number; message: string }[] {
    try {
      const status = (this as any).gitStatus?.() || [];
      const files = status.map((s: any) => s.path);
      return (this as any).policyCheckFiles?.(files) || [];
    } catch { return []; }
  }
  ,
  detectConflicts(): { file: string; lines: number }[] {
    try {
      const root = repoRoot();
      const status = (this as any).gitStatus?.() || [];
      const files = status.map((s: any) => s.path);
      const out: { file: string; lines: number }[] = [];
      const rx = /^(<<<<<<<|=======|>>>>>>>)/;
      for (const rel of files) {
        const abs = path.join(root, rel);
        try {
          const data = fs.readFileSync(abs, 'utf8');
          const count = data.split(/\r?\n/).filter(ln => rx.test(ln)).length;
          if (count > 0) out.push({ file: rel, lines: count });
        } catch {}
      }
      return out;
    } catch { return []; }
  }
  ,
  renameSymbol(oldName: string, newName: string): number {
    try {
      const root = repoRoot();
      let count = 0;
      const rx = new RegExp(`\\b${oldName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
      const ignore = new Set(['node_modules','dist','build','out']);
      const exts = new Set(['.ts','.tsx','.js','.jsx']);
      const walk = (p: string) => {
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.')) continue;
          if (ignore.has(e.name)) continue;
          const abs = path.join(p, e.name);
          if (e.isDirectory()) { walk(abs); continue; }
          const ext = path.extname(e.name).toLowerCase();
          if (!exts.has(ext)) continue;
          try {
            const data = fs.readFileSync(abs, 'utf8');
            if (!rx.test(data)) { rx.lastIndex = 0; continue; }
            const replaced = data.replace(rx, newName);
            if (replaced !== data) {
              fs.writeFileSync(abs, replaced, 'utf8');
              count++;
            }
            rx.lastIndex = 0;
          } catch {}
        }
      };
      walk(root);
      return count;
    } catch { return 0; }
  }
  ,
  readPackageVersion(): string | null {
    try {
      const p = path.join(repoRoot(), 'package.json');
      if (!fs.existsSync(p)) return null;
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      return pkg.version || null;
    } catch { return null; }
  }
  ,
  checkUpdateLocal(): { current: string | null; latest: string | null; updateAvailable: boolean } {
    try {
      const current = (this as any).readPackageVersion?.();
      const p = path.join(repoRoot(), '.rainvibe', 'latest.json');
      const latest = fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')).version || null) : null;
      const parse = (v: string | null) => (v || '0.0.0').split('.').map((x: any) => parseInt(String(x), 10) || 0);
      const a = parse(current), b = parse(latest);
      const update = b[0] > a[0] || (b[0] === a[0] && (b[1] > a[1] || (b[1] === a[1] && b[2] > a[2])));
      return { current, latest, updateAvailable: !!latest && update };
    } catch { return { current: null, latest: null, updateAvailable: false }; }
  }
  ,
  formatWithPrettier(text: string, filename?: string): string | null {
    try {
      let prettier: any = null;
      try { prettier = require('prettier'); } catch { prettier = null; }
      if (!prettier) return null;
      const parser = filename?.endsWith('.ts') || filename?.endsWith('.tsx') ? 'typescript' : filename?.endsWith('.js') || filename?.endsWith('.jsx') ? 'babel' : filename?.endsWith('.json') ? 'json' : filename?.endsWith('.css') ? 'css' : filename?.endsWith('.md') ? 'markdown' : undefined;
      const options: any = parser ? { parser } : {};
      return prettier.format(text, options);
    } catch { return null; }
  }
  ,
  lintWithEslint(text: string, filename: string = 'file.ts'): { message: string; severity: 'error' | 'warning' | 'info'; line: number; column: number }[] {
    try {
      let ESLint: any = null;
      try { ESLint = require('eslint').ESLint; } catch { ESLint = null; }
      if (!ESLint) throw new Error('eslint not available');
      const eslint = new ESLint({ useEslintrc: true, cwd: repoRoot() });
      const results = eslint.lintTextSync ? eslint.lintTextSync(text, { filePath: filename }) : [];
      const out: { message: string; severity: 'error' | 'warning' | 'info'; line: number; column: number }[] = [];
      for (const r of results) {
        for (const m of r.messages || []) {
          out.push({ message: m.message, severity: m.severity === 2 ? 'error' : m.severity === 1 ? 'warning' : 'info', line: m.line || 1, column: m.column || 1 });
        }
      }
      return out;
    } catch {
      // Fallback simple heuristics
      const lines = text.split(/\r?\n/);
      const out: { message: string; severity: 'error' | 'warning' | 'info'; line: number; column: number }[] = [];
      lines.forEach((ln, i) => {
        if (/\bvar\b/.test(ln)) out.push({ message: 'Avoid var, use let/const', severity: 'warning', line: i+1, column: Math.max(1, ln.indexOf('var')+1) });
        if (/[^=]=[^=]/.test(ln)) out.push({ message: 'Use strict equality (===)', severity: 'info', line: i+1, column: 1 });
        if (/\s+$/.test(ln)) out.push({ message: 'Trailing whitespace', severity: 'info', line: i+1, column: ln.length });
      });
      return out;
    }
  }
  ,
  sha256Hex(input: string): string {
    try { return crypto.createHash('sha256').update(input).digest('hex'); } catch { return ''; }
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
  gitMerge(branch: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git merge --no-ff ${branch}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitRebase(onto: string): boolean {
    try {
      const root = repoRoot();
      execSync(`git rebase ${onto}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  gitPush(remote: string = 'origin', branch: string = 'develop'): boolean {
    try {
      const root = repoRoot();
      execSync(`git push ${remote} ${branch}`, { cwd: root, stdio: 'ignore' });
      return true;
    } catch { return false; }
  }
  ,
  runShell(cmd: string, cwdRel?: string): { code: number; output: string } {
    try {
      const root = repoRoot();
      const cwd = cwdRel ? path.resolve(root, cwdRel) : root;
      const out = execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
      return { code: 0, output: out };
    } catch (e: any) {
      try {
        const output = (e?.stdout?.toString?.('utf8') || '') + (e?.stderr?.toString?.('utf8') || e?.message || '');
        const code = typeof e?.status === 'number' ? e.status : 1;
        return { code, output };
      } catch {
        return { code: 1, output: 'Failed to execute command' };
      }
    }
  }
  ,
  // Minimal PTY-like API with polling
  _ptyStore: new Map<string, { proc: any; buffer: string }>(),
  runPtyStart(cmd: string, cwdRel?: string): string | null {
    try {
      const root = repoRoot();
      const cwd = cwdRel ? path.resolve(root, cwdRel) : root;
      const parts = process.platform === 'win32' ? ['powershell.exe','-NoLogo','-NoProfile','-Command', cmd] : ['/bin/sh','-lc', cmd];
      const exe = process.platform === 'win32' ? parts.shift()! : parts.shift()!;
      const child = spawn(exe, parts, { cwd, stdio: 'pipe' });
      const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8);
      const store = { proc: child, buffer: '' };
      child.stdout.on('data', (d: Buffer) => { store.buffer += d.toString('utf8'); });
      child.stderr.on('data', (d: Buffer) => { store.buffer += d.toString('utf8'); });
      child.on('close', (code: number) => { store.buffer += `\n[exit ${code}]\n`; });
      // @ts-ignore
      this._ptyStore.set(id, store);
      return id;
    } catch { return null; }
  }
  ,
  runPtyInput(id: string, text: string): boolean {
    try {
      // @ts-ignore
      const item = this._ptyStore.get(id);
      if (!item) return false;
      item.proc.stdin.write(text);
      return true;
    } catch { return false; }
  }
  ,
  runPtyPoll(id: string): string {
    try {
      // @ts-ignore
      const item = this._ptyStore.get(id);
      if (!item) return '';
      const out = item.buffer;
      item.buffer = '';
      return out;
    } catch { return ''; }
  }
  ,
  runPtyStop(id: string): boolean {
    try {
      // @ts-ignore
      const item = this._ptyStore.get(id);
      if (!item) return false;
      try { item.proc.kill(); } catch {}
      // @ts-ignore
      this._ptyStore.delete(id);
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

