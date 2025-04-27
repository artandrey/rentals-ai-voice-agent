import { toBuilderMethod } from 'class-constructor';

import { AggregateRoot } from '~shared/domain/aggregates/aggregate-root';
import { Entity, Nominal } from '~shared/domain/entities/entity';

import { DayDate } from '../value-objects/day-date.value';
import { DaysSpan } from '../value-objects/days-span.value';
import { Location } from '../value-objects/location.value';
import { Price } from '../value-objects/price.value';
import { Accommodation } from './accommodation';
import { Client } from './client';

export type RentalId = Nominal<string, 'RentalId'>;

export class Rental extends AggregateRoot<RentalId> {
  private _location: Location;
  private _pricePerDay: Price;

  constructor(location: Location, pricePerDay: Price) {
    super();
    this._location = location;
    this._pricePerDay = pricePerDay;
  }

  public get location(): Location {
    return this._location;
  }

  public get pricePerDay(): Price {
    return this._pricePerDay;
  }

  public async createAccommodation(client: Client, startDate: DayDate, endDate: DayDate): Promise<Accommodation> {
    const accommodation = new Accommodation(client, this, startDate, endDate);
    await this._dbContext.accommodations.save(accommodation);
    return accommodation;
  }

  public async getFreeDaysSpansInRangeIncluding(startDate: DayDate, endDate: DayDate): Promise<DaysSpan[]> {
    const searchStart = startDate.settlementTime.getTime();
    const searchEnd = endDate.evictionTime.getTime();

    if (searchStart >= searchEnd) {
      return [];
    }

    const accommodations = await this._dbContext.accommodations.findByRentalId(this.id);

    const occupiedIntervals = accommodations
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

  public static builder = toBuilderMethod(Rental).classAsOptionals();
}
