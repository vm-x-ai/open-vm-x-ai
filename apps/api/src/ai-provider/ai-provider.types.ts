import { AIConnectionEntity } from '../ai-connection/entities/ai-connection.entity';
import { AIResourceModelConfigEntity } from '../ai-resource/common/model.entity';
import { AIProviderRateLimitDto } from './dto/rate-limit.dto';
import { AIProviderDto } from './dto/ai-provider.dto';
import {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/index.js';
import OpenAI from 'openai';

export type CompletionHeaders = {
  'x-request-id'?: string;
  'x-ratelimit-limit-requests'?: string;
  'x-ratelimit-limit-tokens'?: string;
  'x-ratelimit-remaining-requests'?: string;
  'x-ratelimit-remaining-tokens'?: string;
  'x-ratelimit-reset-requests'?: string;
  'x-ratelimit-reset-tokens'?: string;
};

export type CompletionNonStreamingResponse = {
  data: OpenAI.Chat.Completions.ChatCompletion;
  headers: CompletionHeaders;
};

export type CompletionStreamingResponse = {
  data: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  headers: CompletionHeaders;
};

export type CompletionResponseData =
  | OpenAI.Chat.Completions.ChatCompletion
  | OpenAI.Chat.Completions.ChatCompletionChunk;

export type CompletionResponse = {
  data:
    | CompletionStreamingResponse['data']
    | CompletionNonStreamingResponse['data'];
  headers: CompletionHeaders;
};

export interface CompletionProvider {
  provider: AIProviderDto;

  getRateLimit(
    connection: AIConnectionEntity,
    modelConfig: AIResourceModelConfigEntity
  ): Promise<AIProviderRateLimitDto[] | null>;

  completion(
    request: ChatCompletionCreateParamsNonStreaming,
    connection: AIConnectionEntity,
    model: AIResourceModelConfigEntity
  ): Promise<CompletionNonStreamingResponse>;

  completion(
    request: ChatCompletionCreateParamsStreaming,
    connection: AIConnectionEntity,
    model: AIResourceModelConfigEntity
  ): Promise<CompletionStreamingResponse>;

  completion(
    request: ChatCompletionCreateParams,
    connection: AIConnectionEntity,
    model: AIResourceModelConfigEntity
  ): Promise<CompletionResponse>;
}
