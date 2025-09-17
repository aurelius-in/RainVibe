import { contextBridge } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

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
  }
});

