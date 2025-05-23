import { ExceptionType } from '../../mappers/app-exception/exception-type';

export abstract class AppException {
  public readonly type: ExceptionType;

  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly clientMessage?: string,
    public readonly originalError: unknown | null = null,
  ) {
    if (!this.clientMessage) {
      this.clientMessage = this.message;
    }
  }

  toString(): string {
    return `${this.message}`;
  }
}
