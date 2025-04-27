import phone from 'phone';

export class PhoneNumber {
  private constructor(
    public readonly number: string,
    public readonly callingCode: string,
    public readonly countryCode: string,
  ) {}

  public get fullNumber(): string {
    return `${this.callingCode}${this.number}`;
  }

  public static create(number: string): PhoneNumber {
    const { countryCode: callingCode, countryIso2, isValid, phoneNumber } = phone(number);
    if (!isValid) {
      throw new Error('Invalid phone number');
    }
    return new PhoneNumber(phoneNumber.replace(callingCode, ''), callingCode, countryIso2);
  }
}
