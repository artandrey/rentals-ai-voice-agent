import { toBuilderMethod } from 'class-constructor';

import { Entity, Nominal } from '~shared/domain/entities/entity';

import { PhoneNumber } from '../value-objects/phone-number.value';
import { Transcript } from '../value-objects/transcript.value';
import { ClientId } from './client';
import { RentalId } from './rental';

export type CallId = Nominal<string, 'CallId'>;

export enum CallType {
  SETTLEMENT = 'SETTLEMENT',
  EMERGENCY = 'EMERGENCY',
  BOOKING = 'BOOKING',
  INFORMATIVE = 'INFORMATIVE',
}

export class Call extends Entity<CallId> {
  private _transcript: Transcript;
  private _callerPhoneNumber: PhoneNumber;
  private _type: CallType | null = null;
  private _clientId: ClientId | null = null;
  private _associatedRentalId: RentalId | null = null;
  private _callDashboardUrl: string | null = null;
  private _startedAt: Date | null = new Date();
  private _completedAt: Date | null = null;

  constructor(callerPhoneNumber: PhoneNumber) {
    super();
    this._callerPhoneNumber = callerPhoneNumber;
  }

  get transcript(): Transcript {
    return this._transcript;
  }

  get callerPhoneNumber(): PhoneNumber {
    return this._callerPhoneNumber;
  }

  get type(): CallType | null {
    return this._type;
  }

  get clientId(): ClientId | null {
    return this._clientId;
  }

  get associatedRentalId(): RentalId | null {
    return this._associatedRentalId;
  }

  get callDashboardUrl(): string | null {
    return this._callDashboardUrl;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  complete() {
    this._completedAt = new Date();
  }

  public static builder = toBuilderMethod(Call).classAsOptionals();
}
