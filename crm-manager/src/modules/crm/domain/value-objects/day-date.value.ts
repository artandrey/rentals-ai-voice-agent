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
}
