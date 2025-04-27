export abstract class AppException {
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
