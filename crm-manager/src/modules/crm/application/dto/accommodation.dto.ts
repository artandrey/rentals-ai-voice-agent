export class DateDayDto {
  year: number;
  month: number;
  day: number;
}

export class BookRentalDto {
  rentalId: string;
  clientId: string;
  startDate: DateDayDto;
  endDate: DateDayDto;
}
