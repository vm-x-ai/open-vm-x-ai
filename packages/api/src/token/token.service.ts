import { Injectable } from '@nestjs/common';
import { getEncoding, Tiktoken } from 'js-tiktoken';
import { PinoLogger } from 'nestjs-pino';
import { ChatCompletionCreateParams } from 'openai/resources/index.js';

@Injectable()
export class TokenService {
  private encoding: Tiktoken;

  constructor(private readonly logger: PinoLogger) {
    const startTime = Date.now();
    this.logger.info('Initializing token service');
    this.encoding = getEncoding('o200k_base');
    this.logger.info(
      {
        duration: Date.now() - startTime,
      },
      'Token service initialized'
    );
  }

  getRequestTokens(request: ChatCompletionCreateParams) {
    const tokensPerMessage = 3;
    const tokensPerName = 1;
    let numTokens = 3;

    for (const message of request.messages) {
      numTokens += tokensPerMessage;

      for (const [key, value] of Object.entries(message)) {
        if (key === 'tool_calls' && value) {
          numTokens += this.encoding.encode(JSON.stringify(value)).length;
          continue;
        }
        if (key === 'name') {
          numTokens += tokensPerName;
        }

        if (value === null || value === undefined) continue;
        numTokens += this.encoding.encode(value as string).length;
      }
    }

    return numTokens;
  }
}
