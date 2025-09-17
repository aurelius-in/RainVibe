export type Mode = 'Basic' | 'Coach' | 'Bug Fixer' | 'Policy-Safe' | 'Compliance/Audit';

export interface AiModelInfo {
  provider: string;
  model: string;
}

export interface PatchResult {
  summary: string;
  diffs: Array<{ file: string; patch: string }>;
}

