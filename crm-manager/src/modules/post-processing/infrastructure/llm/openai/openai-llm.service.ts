import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

import { ILlmService, Message, Result } from '../../../application/boundaries/llm-service.interface';
import { OPENAI_CLIENT } from './constants';

@Injectable()
export class OpenAiLlmService extends ILlmService {
  constructor(
    @Inject(OPENAI_CLIENT)
    private readonly openaiClient: OpenAI,
  ) {
    super();
  }

  async process(messages: Message[]): Promise<Result> {
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return new Result(response.choices[0]?.message?.content || '');
  }
}
