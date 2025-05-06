export class DayDate {
  private _date: Date;

  constructor(date: Date);
  constructor(year: number, month: number, day: number);
  constructor(dateOrYear: Date | number, month?: number, day?: number) {
    if (dateOrYear instanceof Date) {
      this._date = new Date(dateOrYear.getFullYear(), dateOrYear.getMonth(), dateOrYear.getDate());
    } else if (month && day) {
      this._date = new Date(dateOrYear, month - 1, day);
    }
  }

  get settlementTime(): Date {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 13, 0, 0, 0);
  }

  get evictionTime(): Date {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 12, 0, 0, 0);
  }

  public getTime(): number {
    return new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate()).getTime();
  }

  public isAfter(other: DayDate): boolean {
    return this.getTime() > other.getTime();
  }

  public isBefore(other: DayDate): boolean {
    return this.getTime() < other.getTime();
  }

  public isEqual(other: DayDate): boolean {
    return this.getTime() === other.getTime();
  }

  public toISODateString(): string {
    const year = this._date.getFullYear();
    const month = (this._date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = this._date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public static fromDate(date: Date): DayDate {
    return new DayDate(date);
  }

  public static fromISODateString(dateString: string): DayDate {
    const [year, month, day] = dateString.split('-').map(Number.parseInt);
    return new DayDate(year, month, day);
  }

  public static validate(dateString: string): boolean {
    if (!dateString) return false;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    try {
      const [year, month, day] = dateString.split('-').map(Number.parseInt);

      // Validate month (1-12)
      if (month < 1 || month > 12) return false;

      const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
        if (day > 29) return false;
      } else if (day < 1 || day > daysInMonth[month]) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
