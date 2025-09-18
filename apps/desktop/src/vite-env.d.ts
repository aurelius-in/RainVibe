/// <reference types="vite/client" />

declare global {
  interface Window {
    rainvibe: {
      version: string;
      orgDefaults?: () => any | null;
      policyFiles?: () => string[];
      readReadme?: () => string | null;
      listDir?: (dir?: string) => { path: string; name: string; isDir: boolean }[];
      gitStatus?: () => { status: string; path: string }[];
      appendAudit?: (line: string) => boolean;
      revealInOS?: (relPath: string) => boolean;
      writeBytesBase64?: (relPath: string, base64: string) => boolean;
      mkdir?: (relPath: string) => boolean;
      renamePath?: (fromRel: string, toRel: string) => boolean;
      deletePath?: (relPath: string) => boolean;
    };
  }
}

export {};

