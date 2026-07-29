export interface Page<T> {
  items: T[];
  /** Opaque cursor for the next page, or null when this is the last page. */
  nextCursor: string | null;
}

export interface PageRequest {
  limit: number;
  cursor?: string | null;
}

/**
 * Port for read/write access to a collection of entities of type `T`.
 * `core` and `services` depend only on this interface; `infrastructure`
 * provides the concrete Firestore (or other) implementation. This is what
 * lets a future feature swap or add a data source without touching any
 * business logic that already depends on the port.
 */
export interface Repository<T, Id = string> {
  findById(id: Id): Promise<T | null>;
  list(request: PageRequest): Promise<Page<T>>;
  create(entity: T): Promise<void>;
  update(id: Id, patch: Partial<T>): Promise<void>;
  delete(id: Id): Promise<void>;
}
