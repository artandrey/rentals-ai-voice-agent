export class DayDate {
  private _date: Date;

  constructor(date: Date);
  constructor(year: number, month: number, day: number);
  constructor(dateOrYear: Date | number, month?: number, day?: number) {
    if (dateOrYear instanceof Date) {
      this._date = new Date(dateOrYear.getFullYear(), dateOrYear.getMonth(), dateOrYear.getDate());
    } else {
      this._date = new Date(dateOrYear, month - 1, day);
    }
  }

  get settlementTime(): Date {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 13, 0, 0, 0);
  }

  get evictionTime(): Date {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 12, 0, 0, 0);
  }

  /**
   * Returns the time value (milliseconds since epoch) for the start of the day (00:00:00).
   * Useful for comparing dates without considering time components.
   */
  public getTime(): number {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate()).getTime();
  }

  public isAfter(other: DayDate): boolean {
    return this.getTime() > other.getTime();
  }

  // Optional: Add isBefore and isEqual for completeness
  public isBefore(other: DayDate): boolean {
    return this.getTime() < other.getTime();
  }

  public isEqual(other: DayDate): boolean {
    return this.getTime() === other.getTime();
  }

  // Optional: Helper to create from a standard Date
  public static fromDate(date: Date): DayDate {
    return new DayDate(date);
  }
}
