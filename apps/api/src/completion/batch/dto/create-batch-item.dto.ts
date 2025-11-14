import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import type { CompletionRequestDto } from '../../dto/completion-request.dto';

export class CreateCompletionBatchItemDto {
  @ApiProperty({
    description: 'The name of the resource this item references',
    example: 'openai-gpt4',
  })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    description:
      'The completion request payload (openai chat completion request payload)',
    type: Object,
  })
  @IsNotEmpty()
  request: CompletionRequestDto;
}

export class CreateCompletionBatchItemWithEstimatedPromptTokensDto extends CreateCompletionBatchItemDto {
  @ApiProperty({
    description: 'The estimated number of prompt tokens for the batch item',
    example: 100,
  })
  @IsInt()
  @IsNotEmpty()
  estimatedPromptTokens: number;
}
