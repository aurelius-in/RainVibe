import type { AiProvider, AiMessage, AiProviderConfig } from '../types';

export class LocalProvider implements AiProvider {
  name = 'local';
  constructor(private cfg: AiProviderConfig) {}
  async chat(messages: AiMessage[]): Promise<string> {
    const last = [...messages].reverse().find(m => m.role === 'user');
    return `(local) ${last?.content ?? ''}`.trim();
  }
}

