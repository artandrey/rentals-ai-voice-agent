export interface IBaseRepository<E, Id> {
  findById(id: Id): Promise<E>;
  save(entity: E): Promise<Id>;
  delete(id: Id): Promise<void>;
}
