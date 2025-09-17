import type { AiProvider, AiProviderConfig, AiMessage } from '../types';

export class ChatGPTProvider implements AiProvider {
  name = 'chatgpt';
  constructor(private cfg: AiProviderConfig) {}

  async chat(messages: AiMessage[]): Promise<string> {
    if (this.cfg.offlineOnly) return '[offline]';
    // Minimal stub that echoes last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    return lastUser?.content ? `Echo: ${lastUser.content}` : '...';
  }
}

