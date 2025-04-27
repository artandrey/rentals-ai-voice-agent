export type Nominal<T, K extends string> = T & { __brand: K };

export abstract class Entity<TId = unknown> {
  public readonly id: TId;

  constructor(id?: TId) {
    this.id = id!;
  }

  public equals(entity: Entity): boolean {
    return this.id === entity.id;
  }
}
