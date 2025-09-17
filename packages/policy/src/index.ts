export interface PolicyStatus {
  enabled: boolean;
  ruleFiles: string[];
}

export function summarizePolicy(ruleFiles: string[], enabled: boolean): PolicyStatus {
  return { enabled, ruleFiles };
}

