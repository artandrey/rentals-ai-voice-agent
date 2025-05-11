export class Message {
  role: 'system' | 'user' | 'assistant';
  content: string;

  constructor(role: 'system' | 'user' | 'assistant', content: string) {
    this.role = role;
    this.content = content;
  }
}

export class Result {
  content: string;

  constructor(content: string) {
    this.content = content;
  }
}

export abstract class ILlmService {
  /**
   * Process messages through LLM and return a result
   * @param messages Array of messages to process
   * @returns Result with content field containing the LLM's response
   */
  abstract process(messages: Message[]): Promise<Result>;
}
