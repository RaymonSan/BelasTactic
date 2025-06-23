export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AIProvider {
  chat(messages: ChatMessage[]): Promise<string>;
  chatStream(messages: ChatMessage[]): AsyncIterable<string>;
  embed(text: string): Promise<number[]>;
  isHealthy(): Promise<boolean>;
}

export interface AIResponse {
  answer: string;
  sources?: Array<{ url: string; title: string }>;
  confidence?: number;
  tokensUsed?: number;
  responseTime?: number;
} 