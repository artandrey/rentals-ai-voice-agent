import { Client } from '../entities/client';
import { Rental } from '../entities/rental';
import { Address } from '../value-objects/address.value';
import { DayDate } from '../value-objects/day-date.value';
import { Price } from '../value-objects/price.value';

describe('Rental accommodations', () => {
  describe('free days spans', () => {
    it('should correctly identify free day spans between accommodations', () => {
      const address = new Address('Test Street', 'Test City', '123');
      const price = new Price(100, 'USD');
      const rental = new Rental(address, price);

      const client = new Client('John', 'Doe', '+1234567890', 'john.doe@example.com');

      const startDate1 = new DayDate(2025, 2, 20);
      const endDate1 = new DayDate(2025, 2, 21);

      const startDate2 = new DayDate(2025, 2, 22);
      const endDate2 = new DayDate(2025, 3, 23);

      rental.createAccommodation(client, startDate1, endDate1);
      rental.createAccommodation(client, startDate2, endDate2);

      const searchStartDate = new DayDate(2025, 2, 15);
      const searchEndDate = new DayDate(2025, 3, 30);

      const freeSpans = rental.getFreeDaysSpansInRangeIncluding(searchStartDate, searchEndDate);

      expect(freeSpans).toBeDefined();
      expect(Array.isArray(freeSpans)).toBe(true);

      expect(freeSpans.length).toBe(3);

      const gapBetweenAccommodations = freeSpans.find(
        (span) => span.startDate.getTime() === endDate1.getTime() && span.endDate.getTime() === startDate2.getTime(),
      );

      expect(gapBetweenAccommodations).toBeDefined();
      expect(gapBetweenAccommodations.startDate.getTime()).toEqual(endDate1.getTime());
      expect(gapBetweenAccommodations.endDate.getTime()).toEqual(startDate2.getTime());
    });

    it('should return no free spans when the entire period is occupied', () => {
      const address = new Address('Test Street', 'Test City', '123');
      const price = new Price(100, 'USD');
      const rental = new Rental(address, price);
      const client = new Client('John', 'Doe', '+1234567890', 'john.doe@example.com');

      const startDate = new DayDate(2025, 2, 20);
      const endDate = new DayDate(2025, 2, 25);
      rental.createAccommodation(client, startDate, endDate);

      const freeSpans = rental.getFreeDaysSpansInRangeIncluding(startDate, endDate);

      expect(freeSpans).toBeDefined();
      expect(freeSpans.length).toBe(0);
    });
  });
});
