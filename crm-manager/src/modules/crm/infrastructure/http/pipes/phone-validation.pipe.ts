import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PhoneNumber } from 'src/modules/crm/domain/value-objects/phone-number.value';

@Injectable()
export class PhoneValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): string {
    const isValid = PhoneNumber.validate(value);

    if (!isValid) {
      throw new BadRequestException('Invalid phone number');
    }

    return value;
  }
}
