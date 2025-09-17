import { AiProvider, AiProviderConfig, AiMessage } from '../types';

class NullProvider implements AiProvider {
  name = 'offline-null';
  async chat(messages: AiMessage[]): Promise<string> {
    return '[offline]';
  }
  async *stream(messages: AiMessage[]) {
    yield '[offline]';
  }
}

export function createProvider(config: AiProviderConfig): AiProvider {
  if (config.offlineOnly) return new NullProvider();
  // Default to ChatGPT stub until wired
  return new NullProvider();
}

