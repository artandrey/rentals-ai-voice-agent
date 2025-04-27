import { toBuilderMethod } from 'class-constructor';
import { isEnum } from 'class-validator';

import { Entity, Nominal } from '~shared/domain/entities/entity';

import { UnsupportedLanguageException } from '../exception/unsupported-language.exception';

type ClientId = Nominal<string, 'ClientId'>;

export enum ClientPreferredLanguage {
  ENGLISH = 'en',
  UKRAINIAN = 'uk',
}

export class Client extends Entity<ClientId> {
  private _firstName: string;
  private _lastName: string;
  private _phoneNumber: string;
  private _email: string;

  private _preferredLanguage: ClientPreferredLanguage | null = null;
  private _preferences: string[] = [];
  private _note: string = '';

  constructor(firstName: string, lastName: string, phoneNumber: string, email: string) {
    super();

    this._firstName = firstName;
    this._lastName = lastName;
    this._phoneNumber = phoneNumber;
    this._email = email;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get phoneNumber(): string {
    return this._phoneNumber;
  }

  public get email(): string {
    return this._email;
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
