import { AiProvider, AiProviderConfig, AiMessage } from '../types';
import { ChatGPTProvider } from '../providers/chatgpt';
import { LocalProvider } from '../providers/local';

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
  if (config.provider === 'chatgpt') return new ChatGPTProvider(config);
  if (config.provider === 'local') return new LocalProvider(config);
  return new NullProvider();
}

