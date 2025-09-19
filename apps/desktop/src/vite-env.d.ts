/// <reference types="vite/client" />

declare global {
  interface Window {
    rainvibe: {
      version: string;
      orgDefaults?: () => any | null;
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
    };
  }
}

export {};

