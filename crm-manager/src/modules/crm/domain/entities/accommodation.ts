import { Entity, Nominal } from '~shared/domain/entities/entity';

import { DayDate } from '../value-objects/day-date.value';
import { Client } from './client';
import { Rental } from './rental';

type AccommodationId = Nominal<string, 'AccommodationId'>;

export enum AccommodationStatus {
  PENDING_BOOKING_CONFIRMATION = 'pending_booking_confirmation',
  BOOKING_CONFIRMED = 'booking_confirmed',
  CANCELLED = 'cancelled',
  SETTLED = 'settled',
  COMPLETED = 'completed',
}

export interface IAccommodationState {
  confirm(): void;
  cancel(): void;
  settle(): void;
  complete(): void;
}

abstract class BaseAccommodationState implements IAccommodationState {
  protected _accommodation: Accommodation;

  constructor(accommodation: Accommodation) {
    this._accommodation = accommodation;
  }

  abstract confirm(): void;
  abstract cancel(): void;
  abstract settle(): void;
  abstract complete(): void;
}

export class Accommodation extends Entity<AccommodationId> {
  private _client: Client;
  private _rental: Rental;
  private _endDate: DayDate;
  private _startDate: DayDate;
  private _status: AccommodationStatus = AccommodationStatus.PENDING_BOOKING_CONFIRMATION;
  private _state: IAccommodationState;

  constructor(client: Client, rental: Rental, startDate: DayDate, endDate: DayDate) {
    super();
    this._client = client;
    this._rental = rental;
    this._startDate = startDate;
    this._endDate = endDate;

    this._state = new Accommodation._stateMap[this._status](this);
  }

  public get client(): Client {
    return this._client;
  }

  public get rental(): Rental {
    return this._rental;
  }

  public get endDate(): DayDate {
    return this._endDate;
  }

  public get startDate(): DayDate {
    return this._startDate;
  }

  public get status(): AccommodationStatus {
    return this._status;
  }

  public confirm(): void {
    this._state.confirm();
    this._updateState();
  }

  public cancel(): void {
    this._state.cancel();
    this._updateState();
  }

  public settle(): void {
    this._state.settle();
    this._updateState();
  }

  public complete(): void {
    this._state.complete();
    this._updateState();
  }

  private _updateState(): void {
    this._state = new Accommodation._stateMap[this._status](this);
  }
  static PendingBookingConfirmationState: new (accommodation: Accommodation) => IAccommodationState;
  static BookingConfirmedState: new (accommodation: Accommodation) => IAccommodationState;
  static CancelledState: new (accommodation: Accommodation) => IAccommodationState;
  static SettledState: new (accommodation: Accommodation) => IAccommodationState;
  static CompletedState: new (accommodation: Accommodation) => IAccommodationState;

  static {
    class PendingBookingConfirmationState extends BaseAccommodationState {
      confirm(): void {
        this._accommodation._status = AccommodationStatus.BOOKING_CONFIRMED;
      }

      cancel(): void {
        this._accommodation._status = AccommodationStatus.CANCELLED;
      }

      settle(): void {
        throw new Error('Unable to settle accommodation in pending booking confirmation state');
      }

      complete(): void {
        throw new Error('Unable to complete accommodation in pending booking confirmation state');
      }
    }

    class BookingConfirmedState extends BaseAccommodationState {
      confirm(): void {
        throw new Error('Accommodation is already confirmed');
      }

      cancel(): void {
        this._accommodation._status = AccommodationStatus.CANCELLED;
      }

      settle(): void {
        this._accommodation._status = AccommodationStatus.SETTLED;
      }

      complete(): void {
        throw new Error('Unable to complete accommodation in booking confirmed state');
      }
    }

    class CancelledState extends BaseAccommodationState {
      confirm(): void {
        throw new Error('Unable to confirm a cancelled accommodation');
      }

      cancel(): void {
        throw new Error('Accommodation is already cancelled');
      }

      settle(): void {
        throw new Error('Unable to settle a cancelled accommodation');
      }

      complete(): void {
        throw new Error('Unable to complete a cancelled accommodation');
      }
    }

    class SettledState extends BaseAccommodationState {
      confirm(): void {
        throw new Error('Unable to confirm a settled accommodation');
      }

      cancel(): void {
        throw new Error('Unable to cancel a settled accommodation');
      }

      settle(): void {
        throw new Error('Accommodation is already settled');
      }

      complete(): void {
        this._accommodation._status = AccommodationStatus.COMPLETED;
      }
    }

    class CompletedState extends BaseAccommodationState {
      confirm(): void {
        throw new Error('Unable to confirm a completed accommodation');
      }

      cancel(): void {
        throw new Error('Unable to cancel a completed accommodation');
      }

      settle(): void {
        throw new Error('Unable to settle a completed accommodation');
      }

      complete(): void {
        throw new Error('Accommodation is already completed');
      }
    }

    Accommodation.PendingBookingConfirmationState = PendingBookingConfirmationState;
    Accommodation.BookingConfirmedState = BookingConfirmedState;
    Accommodation.CancelledState = CancelledState;
    Accommodation.SettledState = SettledState;
    Accommodation.CompletedState = CompletedState;
  }

  private static _stateMap: Record<AccommodationStatus, new (accommodation: Accommodation) => IAccommodationState> = {
    [AccommodationStatus.PENDING_BOOKING_CONFIRMATION]: Accommodation.PendingBookingConfirmationState,
    [AccommodationStatus.BOOKING_CONFIRMED]: Accommodation.BookingConfirmedState,
    [AccommodationStatus.CANCELLED]: Accommodation.CancelledState,
    [AccommodationStatus.SETTLED]: Accommodation.SettledState,
    [AccommodationStatus.COMPLETED]: Accommodation.CompletedState,
  };
}
