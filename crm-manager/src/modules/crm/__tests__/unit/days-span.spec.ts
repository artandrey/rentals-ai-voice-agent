import { describe, expect, it } from 'vitest';

import { DayDate } from '../../domain/value-objects/day-date.value';
import { DaysSpan } from '../../domain/value-objects/days-span.value';

describe('DaysSpan', () => {
  describe('creation', () => {
    it('should create a valid DaysSpan using static create method', () => {
      const startDate = new DayDate(2025, 2, 21);
      const endDate = new DayDate(2025, 2, 22);

      const daysSpan = DaysSpan.create(startDate, endDate);

      expect(daysSpan).toBeDefined();
      expect(daysSpan.startDate).toBe(startDate);
      expect(daysSpan.endDate).toBe(endDate);
    });

    it('should throw error when end date is before start date', () => {
      const startDate = new DayDate(2025, 2, 22);
      const endDate = new DayDate(2025, 2, 21);

      expect(() => DaysSpan.create(startDate, endDate)).toThrow();
    });

    it('should throw error when dates are equal', () => {
      const startDate = new DayDate(2025, 2, 21);
      const endDate = new DayDate(2025, 2, 21);

      expect(() => DaysSpan.create(startDate, endDate)).toThrow();
    });
  });

  describe('living days count', () => {
    it('should return 1 for adjacent days (21.02.2025-22.02.2025)', () => {
      const startDate = new DayDate(2025, 2, 21);
      const endDate = new DayDate(2025, 2, 22);
      const daysSpan = DaysSpan.create(startDate, endDate);

      expect(daysSpan.getLivingDaysCount()).toBe(1);
    });

    it('should return 25 for a month span (31.03.2025-25.04.2025)', () => {
      const startDate = new DayDate(2025, 3, 31);
      const endDate = new DayDate(2025, 4, 25);
      const daysSpan = DaysSpan.create(startDate, endDate);

      expect(daysSpan.getLivingDaysCount()).toBe(25);
    });

    it('should return 7 for a week span', () => {
      const startDate = new DayDate(2025, 5, 1);
      const endDate = new DayDate(2025, 5, 8);
      const daysSpan = DaysSpan.create(startDate, endDate);

      expect(daysSpan.getLivingDaysCount()).toBe(7);
    });

    it('should handle leap years correctly', () => {
      const startDate = new DayDate(2024, 2, 28);
      const endDate = new DayDate(2024, 3, 1);
      const daysSpan = DaysSpan.create(startDate, endDate);

      expect(daysSpan.getLivingDaysCount()).toBe(2);
    });
  });
});
