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
    // Check if the phone number starts with a plus sign
    if (!number.startsWith('+')) {
      throw new Error('Phone number must start with a plus sign (+) followed by country code');
    }

    const { countryCode: callingCode, countryIso2, isValid, phoneNumber } = phone(number);

    if (!isValid) {
      throw new Error(`Invalid phone number: ${number}`);
    }

    return new PhoneNumber(phoneNumber.replace(callingCode, ''), callingCode, countryIso2);
  }

  public static validate(number: string): boolean {
    if (!number.startsWith('+')) {
      return false;
    }
    const { isValid } = phone(number);
    return isValid;
  }
}
