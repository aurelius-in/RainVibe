export interface RunResult { output: string; code: number }

export async function simulateRun(command: string): Promise<RunResult> {
  return new Promise(resolve => setTimeout(() => resolve({ output: `Ran: ${command}`, code: 0 }), 200));
}

