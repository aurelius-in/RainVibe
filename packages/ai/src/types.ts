export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProviderConfig {
  provider: 'chatgpt' | 'anthropic' | 'azure' | 'local';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  offlineOnly?: boolean;
}

export interface AiProvider {
  name: string;
  chat(messages: AiMessage[], cfg?: Partial<AiProviderConfig>): Promise<string>;
  stream?(messages: AiMessage[], cfg?: Partial<AiProviderConfig>): AsyncGenerator<string>;
}

