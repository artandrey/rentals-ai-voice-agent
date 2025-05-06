import { BadRequestException, Injectable, Scope } from '@nestjs/common';

import { RentalId } from '~modules/crm/domain/entities/rental';
import { RentalNotFoundException } from '~modules/crm/domain/exception/rental-not-found.exception';
import { DayDate } from '~modules/crm/domain/value-objects/day-date.value';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { AvailableDateSpansDto, DaysSpanDto } from '../dto/rental.dto';

export interface GetRentalAvailableDateSpansPayload {
  rentalId: RentalId;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export abstract class IGetRentalAvailableDateSpansQuery
  extends Query<GetRentalAvailableDateSpansPayload, AvailableDateSpansDto>
  implements IUseCase<GetRentalAvailableDateSpansPayload, AvailableDateSpansDto> {}

@Injectable({ scope: Scope.REQUEST })
export class GetRentalAvailableDateSpansQuery extends IGetRentalAvailableDateSpansQuery {
  constructor() {
    super();
  }

  async implementation(): Promise<AvailableDateSpansDto> {
    const { rentalId, startDate, endDate } = this._input;

    const rental = await this._dbContext.rentalsRepository.findById(rentalId);

    if (!rental) {
      throw new RentalNotFoundException(rentalId);
    }

    const startDayDate = DayDate.fromISODateString(startDate);
    const endDayDate = DayDate.fromISODateString(endDate);

    if (startDayDate.isAfter(endDayDate) || startDayDate.isEqual(endDayDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const availableSpans = await rental.getFreeDaysSpansInRangeIncluding(startDayDate, endDayDate);

    return {
      rentalId,
      availableSpans: availableSpans.map((span) => ({
        startDate: span.startDate.toISODateString(),
        endDate: span.endDate.toISODateString(),
        daysCount: span.getLivingDaysCount(),
      })),
    };
  }
}
