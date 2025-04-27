import { Entity, Nominal } from '~shared/domain/entities/entity';

import { Address } from '../value-objects/address.value';
import { DayDate } from '../value-objects/day-date.value';
import { DaysSpan } from '../value-objects/days-span.value';
import { Price } from '../value-objects/price.value';
import { Accommodation } from './accommodation';
import { Client } from './client';

type RentalId = Nominal<string, 'RentalId'>;

export class Rental extends Entity<RentalId> {
  private _address: Address;
  private _price: Price;
  private _accommodations: Accommodation[] = [];

  constructor(address: Address, price: Price) {
    super();
    this._address = address;
    this._price = price;
  }

  public get address(): Address {
    return this._address;
  }

  public get price(): Price {
    return this._price;
  }

  public get accommodations(): ReadonlyArray<Accommodation> {
    return this._accommodations;
  }

  public createAccommodation(client: Client, startDate: DayDate, endDate: DayDate): Accommodation {
    const accommodation = new Accommodation(client, this, startDate, endDate);
    this._accommodations.push(accommodation);
    return accommodation;
  }

  public getFreeDaysSpansInRangeIncluding(startDate: DayDate, endDate: DayDate): DaysSpan[] {
    const searchStart = startDate.settlementTime.getTime();
    const searchEnd = endDate.evictionTime.getTime();

    if (searchStart >= searchEnd) {
      return [];
    }

    const occupiedIntervals = this._accommodations
      .map((acc) => ({
        start: acc.startDate.settlementTime.getTime(),
        end: acc.endDate.evictionTime.getTime(),
        startDay: acc.startDate,
        endDay: acc.endDate,
      }))
      .filter((interval) => interval.end > searchStart && interval.start < searchEnd)
      .sort((a, b) => a.start - b.start);

    const mergedIntervals: { start: number; end: number; startDay: DayDate; endDay: DayDate }[] = [];
    for (const current of occupiedIntervals) {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({ ...current });
        continue;
      }

      const lastMerged = mergedIntervals[mergedIntervals.length - 1];

      if (current.start <= lastMerged.end) {
        if (current.end > lastMerged.end) {
          lastMerged.end = current.end;
          lastMerged.endDay = current.endDay;
        }
      } else {
        mergedIntervals.push({ ...current });
      }
    }

    const freeSpans: DaysSpan[] = [];
    let pointerTime = searchStart;
    let pointerDay = startDate;

    for (const interval of mergedIntervals) {
      if (interval.start > pointerTime) {
        if (interval.startDay.getTime() > pointerDay.getTime()) {
          freeSpans.push(DaysSpan.create(pointerDay, interval.startDay));
        }
      }
      if (interval.end > pointerTime) {
        pointerTime = interval.end;
        pointerDay = interval.endDay;
      }
    }

    if (pointerTime < searchEnd) {
      if (endDate.getTime() > pointerDay.getTime()) {
        freeSpans.push(DaysSpan.create(pointerDay, endDate));
      }
    }

    return freeSpans;
  }
}
