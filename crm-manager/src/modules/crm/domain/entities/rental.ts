import { toBuilderMethod } from 'class-constructor';

import { AggregateRoot } from '~shared/domain/aggregates/aggregate-root';
import { Nominal } from '~shared/domain/entities/entity';

import { Amenity } from '../value-objects/amenity.value';
import { DayDate } from '../value-objects/day-date.value';
import { DaysSpan } from '../value-objects/days-span.value';
import { Location } from '../value-objects/location.value';
import { Price } from '../value-objects/price.value';
import { Accommodation, AccommodationId } from './accommodation';
import { ClientId } from './client';

export type RentalId = Nominal<string, 'RentalId'>;

export class Rental extends AggregateRoot<RentalId> {
  private _location: Location;
  private _pricePerDay: Price;
  private _description: string;
  private _amenities: Amenity[] = [];
  private _settlementDetails: string = '';
  private _emergencyDetails: string = '';

  constructor(
    location: Location,
    pricePerDay: Price,
    description: string = '',
    amenities: Amenity[] = [],
    settlementDetails: string = '',
    emergencyDetails: string = '',
  ) {
    super();
    this._location = location;
    this._pricePerDay = pricePerDay;
    this._description = description;
    this._amenities = [...amenities];
    this._settlementDetails = settlementDetails;
    this._emergencyDetails = emergencyDetails;
  }

  public get location(): Location {
    return this._location;
  }

  public get pricePerDay(): Price {
    return this._pricePerDay;
  }

  public get description(): string {
    return this._description;
  }

  public get amenities(): Amenity[] {
    return [...this._amenities];
  }

  public get settlementDetails(): string {
    return this._settlementDetails;
  }

  public get emergencyDetails(): string {
    return this._emergencyDetails;
  }

  public async createAccommodation(clientId: ClientId, startDate: DayDate, endDate: DayDate): Promise<AccommodationId> {
    const accommodation = new Accommodation(clientId, this.id, startDate, endDate);
    const createdAccommodationId = await this._dbContext.accommodationsRepository.save(accommodation);
    return createdAccommodationId;
  }

  public async getFreeDaysSpansInRangeIncluding(startDate: DayDate, endDate: DayDate): Promise<DaysSpan[]> {
    const searchStart = startDate.settlementTime.getTime();
    const searchEnd = endDate.evictionTime.getTime();

    if (searchStart >= searchEnd) {
      return [];
    }

    const accommodations = await this._dbContext.accommodationsRepository.findByRentalId(this.id);

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
