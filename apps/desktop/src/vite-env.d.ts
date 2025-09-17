/// <reference types="vite/client" />

declare global {
  interface Window {
    rainvibe: {
      version: string;
      orgDefaults?: () => any | null;
      policyFiles?: () => string[];
      readReadme?: () => string | null;
      listDir?: (dir?: string) => { path: string; name: string; isDir: boolean }[];
    };
  }
}

export {};

