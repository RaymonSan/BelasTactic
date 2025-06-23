import { AIProvider, ChatMessage } from './types';

export * from './types';

export class HybridAIService implements AIProvider {
  constructor(
    private ollamaService: AIProvider,
    private openaiService: AIProvider
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      // Try local Ollama first
      if (await this.ollamaService.isHealthy()) {
        return await this.ollamaService.chat(messages);
      }
    } catch (error) {
      console.warn('Ollama unavailable, falling back to OpenAI:', error);
    }
    
    // Fallback to OpenAI
    return await this.openaiService.chat(messages);
  }

  async *chatStream(messages: ChatMessage[]): AsyncIterable<string> {
    try {
      // Try local Ollama first
      if (await this.ollamaService.isHealthy()) {
        yield* this.ollamaService.chatStream(messages);
        return;
      }
    } catch (error) {
      console.warn('Ollama unavailable, falling back to OpenAI:', error);
    }
    
    // Fallback to OpenAI
    yield* this.openaiService.chatStream(messages);
  }

  async embed(text: string): Promise<number[]> {
    // Use OpenAI for embeddings (better quality)
    return await this.openaiService.embed(text);
  }

  async isHealthy(): Promise<boolean> {
    const [ollamaHealthy, openaiHealthy] = await Promise.all([
      this.ollamaService.isHealthy().catch(() => false),
      this.openaiService.isHealthy().catch(() => false),
    ]);
    
    return ollamaHealthy || openaiHealthy;
  }
}

// Export specific services when they are properly set up
// export { OllamaService } from './ollama-service';
// export { OpenAIService } from './openai-service'; 