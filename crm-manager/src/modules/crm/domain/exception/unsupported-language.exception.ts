import { AppException } from '~core/exceptions/domain/exceptions/base/app.exception';

export class UnsupportedLanguageException extends AppException {
  constructor(language: string, supportedLanguages: string[]) {
    super(
      'UNSUPPORTED_LANGUAGE',
      `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`,
    );
  }
}
