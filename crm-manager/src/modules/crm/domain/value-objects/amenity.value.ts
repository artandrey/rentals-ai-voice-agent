export class Amenity {
  constructor(public readonly title: string) {}

  public static create(title: string): Amenity {
    if (!title || title.trim().length === 0) {
      throw new Error('Amenity title cannot be empty');
    }
    return new Amenity(title.trim());
  }

  public equals(other: Amenity): boolean {
    return this.title.toLowerCase() === other.title.toLowerCase();
  }
}
