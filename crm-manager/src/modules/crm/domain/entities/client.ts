import { toBuilderMethod } from 'class-constructor';
import { isEnum } from 'class-validator';

import { Entity, Nominal } from '~shared/domain/entities/entity';

import { UnsupportedLanguageException } from '../exception/unsupported-language.exception';
import { PhoneNumber } from '../value-objects/phone-number.value';

export type ClientId = Nominal<string, 'ClientId'>;

export enum ClientPreferredLanguage {
  ENGLISH = 'EN',
  UKRAINIAN = 'UK',
}

export class Client extends Entity<ClientId> {
  private _firstName: string;
  private _lastName: string;
  private _middleName: string | null = null;
  private _phoneNumber: PhoneNumber;

  private _preferredLanguage: ClientPreferredLanguage | null = null;
  private _preferences: string[] = [];
  private _note: string = '';

  constructor(firstName: string, lastName: string, phoneNumber: PhoneNumber) {
    super();

    this._firstName = firstName;
    this._lastName = lastName;
    this._phoneNumber = phoneNumber;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  public get middleName(): string | null {
    return this._middleName;
  }

  public get preferredLanguage(): ClientPreferredLanguage | null {
    return this._preferredLanguage;
  }

  public get preferences(): string[] {
    return this._preferences;
  }

  public get note(): string | null {
    return this._note;
  }

  public setFirstName(firstName: string): void {
    this._firstName = firstName;
  }

  public setLastName(lastName: string): void {
    this._lastName = lastName;
  }

  public setMiddleName(middleName: string | null): void {
    this._middleName = middleName;
  }

  public setPhoneNumber(phoneNumber: PhoneNumber): void {
    this._phoneNumber = phoneNumber;
  }

  public setPreferences(preferences: string[]): void {
    this._preferences = [...preferences];
  }

  public addPreference(preference: string): void {
    this._preferences.push(preference);
  }

  public setNote(note: string): void {
    this._note = note;
  }

  public setPreferredLanguage(preferredLanguage: ClientPreferredLanguage): void {
    if (!isEnum(preferredLanguage, ClientPreferredLanguage)) {
      throw new UnsupportedLanguageException(preferredLanguage, Object.values(ClientPreferredLanguage));
    }

    this._preferredLanguage = preferredLanguage;
  }

  public static builder = toBuilderMethod(Client).classAsOptionals();
}
