import { describe, expect, it } from 'vitest';

import { Client } from '../../domain/entities/client';
import { Rental } from '../../domain/entities/rental';
import { DayDate } from '../../domain/value-objects/day-date.value';
import { Location } from '../../domain/value-objects/location.value';
import { PhoneNumber } from '../../domain/value-objects/phone-number.value';
import { Price } from '../../domain/value-objects/price.value';

describe('Rental accommodations', () => {
  describe('free days spans', () => {
    it('should correctly identify free day spans between accommodations', async () => {
      const address = new Location('Test Street', 'Test City', '123');
      const price = new Price(100, 'USD');
      const rental = new Rental(address, price);

      // Mock dbContext and repository
      const mockAccommodations: any[] = [];
      const mockDbContext = {
        accommodationsRepository: {
          save: async (acc: any) => {
            mockAccommodations.push(acc);
            return acc.id || 'mock-id';
          },
          findByRentalId: async () => mockAccommodations,
        },
      };
      rental._setContext(mockDbContext as any);

      const client = new Client('John', 'Doe', PhoneNumber.create('+14155552671'));

      const startDate1 = new DayDate(2025, 2, 20);
      const endDate1 = new DayDate(2025, 2, 21);

      const startDate2 = new DayDate(2025, 2, 22);
      const endDate2 = new DayDate(2025, 3, 23);

      await rental.createAccommodation(client.id, startDate1, endDate1);
      await rental.createAccommodation(client.id, startDate2, endDate2);

      const searchStartDate = new DayDate(2025, 2, 15);
      const searchEndDate = new DayDate(2025, 3, 30);

      const freeSpans = await rental.getFreeDaysSpansInRangeIncluding(searchStartDate, searchEndDate);

      expect(freeSpans).toBeDefined();
      expect(Array.isArray(freeSpans)).toBe(true);

      expect(freeSpans.length).toBe(3);

      const gapBetweenAccommodations = freeSpans.find(
        (span) => span.startDate.getTime() === endDate1.getTime() && span.endDate.getTime() === startDate2.getTime(),
      );

      expect(gapBetweenAccommodations).toBeDefined();
      if (gapBetweenAccommodations) {
        expect(gapBetweenAccommodations.startDate.getTime()).toEqual(endDate1.getTime());
        expect(gapBetweenAccommodations.endDate.getTime()).toEqual(startDate2.getTime());
      }
    });

    it('should return no free spans when the entire period is occupied', async () => {
      const address = new Location('Test Street', 'Test City', '123');
      const price = new Price(100, 'USD');
      const rental = new Rental(address, price);
      // Mock dbContext and repository
      const mockAccommodations: any[] = [];
      const mockDbContext = {
        accommodationsRepository: {
          save: async (acc: any) => {
            mockAccommodations.push(acc);
            return acc.id || 'mock-id';
          },
          findByRentalId: async () => mockAccommodations,
        },
      };
      rental._setContext(mockDbContext as any);
      const client = new Client('John', 'Doe', PhoneNumber.create('+14155552671'));

      const startDate = new DayDate(2025, 2, 20);
      const endDate = new DayDate(2025, 2, 25);
      await rental.createAccommodation(client.id, startDate, endDate);

      const freeSpans = await rental.getFreeDaysSpansInRangeIncluding(startDate, endDate);

      expect(freeSpans).toBeDefined();
      expect(freeSpans.length).toBe(0);
    });
  });
});
