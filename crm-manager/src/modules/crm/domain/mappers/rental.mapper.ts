import { Injectable } from '@nestjs/common';

import {
  CompactRentalDto,
  RentalEmergencyDetailsDto,
  RentalSettlementDetailsDto,
} from '../../application/dto/rental.dto';
import { Rental } from '../entities/rental';

@Injectable()
export class RentalMapper {
  public toCompactDto(rental: Rental): CompactRentalDto {
    return {
      id: rental.id,
      price: rental.pricePerDay,
      description: rental.description,
      location: rental.location,
      amenities: rental.amenities,
    };
  }

  public toSettlementDetailsDto(rental: Rental): RentalSettlementDetailsDto {
    return {
      settlementDetails: rental.settlementDetails,
    };
  }

  public toEmergencyDetailsDto(rental: Rental): RentalEmergencyDetailsDto {
    return {
      emergencyDetails: rental.emergencyDetails,
    };
  }
}
