import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { DayDate } from '~modules/crm/domain/value-objects/day-date.value';

@Injectable()
export class DateValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('Date is required');
    }

    const isValid = DayDate.validate(value);

    if (!isValid) {
      throw new BadRequestException('Invalid date format. Date must be in ISO format (YYYY-MM-DD)');
    }

    return value;
  }
}
