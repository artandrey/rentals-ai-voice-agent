import { DayDate } from './day-date.value';

export class DaysSpan {
  private constructor(
    public readonly startDate: DayDate,
    public readonly endDate: DayDate,
  ) {}

  public static create(startDate: DayDate, endDate: DayDate): DaysSpan {
    if (startDate.isAfter(endDate) || startDate.isEqual(endDate)) {
      throw new Error('Start date must be strictly before end date in DaysSpan');
    }
    return new DaysSpan(startDate, endDate);
  }

  public getLivingDaysCount(): number {
    return Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}
