export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly houseNumber: string,
    public readonly apparentNumber: string | null = null,
  ) {}
}
