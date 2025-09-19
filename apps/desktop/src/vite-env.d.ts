/// <reference types="vite/client" />

declare global {
  interface Window {
    rainvibe: {
      version: string;
      orgDefaults?: () => any | null;
      loadPrompt?: (name: string) => string | null;
      orgMtime?: () => number | null;
      policyFiles?: () => string[];
      readReadme?: () => string | null;
      listDir?: (dir?: string) => { path: string; name: string; isDir: boolean }[];
      searchText?: (term: string, dir?: string) => { path: string; line: number; preview: string }[];
      gitStatus?: () => { status: string; path: string }[];
      gitAdd?: (relPath?: string) => boolean;
      gitCommit?: (message: string) => boolean;
      gitCheckout?: (branch: string, create?: boolean) => boolean;
      gitStash?: (message?: string) => boolean;
      gitStashList?: () => { name: string; message: string }[];
      gitStashApply?: (name: string) => boolean;
      gitStashDrop?: (name: string) => boolean;
      gitInit?: () => boolean;
      gitRestore?: (relPath: string) => boolean;
      gitShowFile?: (relPath: string, ref?: string) => string | null;
      gitLog?: (limit?: number) => { hash: string; author: string; date: string; subject: string }[];
      gitBlame?: (relPath: string, maxLines?: number) => string | null;
      gitDiff?: (relPath: string, refA?: string, refB?: string) => string | null;
      gitShowCommit?: (hash: string) => string | null;
      gitBranch?: () => string | null;
      appendAudit?: (line: string) => boolean;
      clearAudit?: () => boolean;
      revealInOS?: (relPath: string) => boolean;
      openPath?: (relPath: string) => boolean;
      writeBytesBase64?: (relPath: string, base64: string) => boolean;
      mkdir?: (relPath: string) => boolean;
      renamePath?: (fromRel: string, toRel: string) => boolean;
      deletePath?: (relPath: string) => boolean;
      readPackageScripts?: () => string[];
      listKits?: () => string[];
      installKit?: (name: string, readme?: string) => boolean;
      removeKit?: (name: string) => boolean;
      updateKit?: (name: string, note?: string) => boolean;
      formatWithPrettier?: (text: string, filename?: string) => string | null;
      lintWithEslint?: (text: string, filename?: string) => { message: string; severity: 'error' | 'warning' | 'info'; line: number; column: number }[];
      runShell?: (cmd: string, cwdRel?: string) => { code: number; output: string };
      sha256Hex?: (input: string) => string;
      gitMerge?: (branch: string) => boolean;
      gitRebase?: (onto: string) => boolean;
      gitPush?: (remote?: string, branch?: string) => boolean;
      buildIndex?: () => number;
      searchIndex?: (term: string) => { path: string; line: number; preview: string }[];
      indexSymbols?: () => number;
      searchSymbols?: (term: string) => { path: string; line: number; name: string; kind: string }[];
      policyHints?: () => string[];
      loadPolicyRules?: () => Array<{ name: string; pattern: string; message?: string }>;
      policyCheckFiles?: (files: string[]) => { file: string; line: number; message: string }[];
      policyCheckChanged?: () => { file: string; line: number; message: string }[];
      detectConflicts?: () => { file: string; lines: number }[];
      readPackageVersion?: () => string | null;
      checkUpdateLocal?: () => { current: string | null; latest: string | null; updateAvailable: boolean };
      runPtyStart?: (cmd: string, cwdRel?: string) => string | null;
      runPtyInput?: (id: string, text: string) => boolean;
      runPtyPoll?: (id: string) => string;
      runPtyStop?: (id: string) => boolean;
      saveSecret?: (key: string, value: string) => boolean;
      loadSecret?: (key: string) => string | null;
      deleteSecret?: (key: string) => boolean;
      renameSymbol?: (oldName: string, newName: string) => number;
    };
  }
}

export {};

