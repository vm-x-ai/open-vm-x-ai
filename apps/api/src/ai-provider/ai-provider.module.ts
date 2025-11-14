import { Module } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { AIProviderService } from './ai-provider.service';
import { AIProviderController } from './ai-provider.controller';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [],
  controllers: [AIProviderController],
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    GroqProvider,
    GeminiProvider,
    AIProviderService,
  ],
  exports: [AIProviderService],
})
export class AIProviderModule {}
