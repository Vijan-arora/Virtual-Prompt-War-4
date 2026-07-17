import type { Firestore } from '@google-cloud/firestore';

type DocData = Record<string, unknown>;

interface FakeDocRef {
  id: string;
  collectionName: string;
  get(): Promise<{ data(): DocData | undefined; exists: boolean }>;
  set(data: DocData): Promise<void>;
}

interface FakeQuerySnapshot {
  empty: boolean;
  docs: { data(): DocData; ref: FakeDocRef }[];
}

function resolveValue(existing: unknown, update: unknown): unknown {
  if (update && typeof update === 'object') {
    const updateObj = update as { constructor?: { name?: string }; operand?: unknown };
    const constructorName = updateObj.constructor?.name;
    if (
      (constructorName === 'NumericIncrementTransform' || constructorName === 'FieldValue') &&
      typeof updateObj.operand === 'number'
    ) {
      const existingNum = typeof existing === 'number' ? existing : 0;
      return existingNum + updateObj.operand;
    }
  }
  return update;
}

/**
 * Mock Firestore database implementing a minimal in-memory store for testing.
 */
export class FakeFirestore {
  private readonly store = new Map<string, Map<string, DocData>>();

  private col(name: string): Map<string, DocData> {
    let collection = this.store.get(name);
    if (!collection) {
      collection = new Map<string, DocData>();
      this.store.set(name, collection);
    }
    return collection;
  }

  /**
   * Clears all collections and documents from the in-memory store.
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * Directly reads a document from a collection without a Promise.
   *
   * @param collectionName - The collection containing the document.
   * @param id - Unique identifier of the document.
   * @returns The raw document data, or undefined if absent.
   */
  read(collectionName: string, id: string): DocData | undefined {
    return this.col(collectionName).get(id);
  }

  private makeDocRef(collectionName: string, id: string): FakeDocRef {
    const collection = this.col(collectionName);
    return {
      id,
      collectionName,
      get: () => Promise.resolve({ data: () => collection.get(id), exists: collection.has(id) }),
      set: (data: DocData) => {
        collection.set(id, data);
        return Promise.resolve();
      },
    };
  }

  private makeSnapshot(collectionName: string, limit?: number): FakeQuerySnapshot {
    const entries = [...this.col(collectionName).entries()].slice(0, limit);
    return {
      empty: entries.length === 0,
      docs: entries.map(([id, data]) => ({
        data: () => data,
        ref: this.makeDocRef(collectionName, id),
      })),
    };
  }

  /**
   * Returns a mock reference to the specified collection.
   *
   * @param name - The collection name.
   */
  collection(name: string): {
    get(): Promise<FakeQuerySnapshot>;
    limit(n: number): { get(): Promise<FakeQuerySnapshot> };
    doc(id: string): FakeDocRef;
  } {
    return {
      get: () => Promise.resolve(this.makeSnapshot(name)),
      limit: (n: number) => ({ get: () => Promise.resolve(this.makeSnapshot(name, n)) }),
      doc: (id: string) => this.makeDocRef(name, id),
    };
  }

  private mergeAndStore(
    collectionName: string,
    id: string,
    fields: DocData,
    existing: DocData,
  ): void {
    const collection = this.col(collectionName);
    const merged = { ...existing };
    for (const [key, val] of Object.entries(fields)) {
      merged[key] = resolveValue(existing[key], val);
    }
    collection.set(id, merged);
  }

  /**
   * Creates a mock write batch for executing multiple mutations.
   */
  batch(): {
    set(ref: FakeDocRef, fields: DocData, options?: { merge?: boolean }): void;
    update(ref: FakeDocRef, fields: DocData): void;
    commit(): Promise<void>;
  } {
    const operations: (() => void)[] = [];
    return {
      set: (ref, fields, options) => {
        operations.push(() => {
          const existing =
            options?.merge === true ? (this.col(ref.collectionName).get(ref.id) ?? {}) : {};
          this.mergeAndStore(ref.collectionName, ref.id, fields, existing);
        });
      },
      update: (ref, fields) => {
        operations.push(() => {
          const existing = this.col(ref.collectionName).get(ref.id) ?? {};
          this.mergeAndStore(ref.collectionName, ref.id, fields, existing);
        });
      },
      commit: () => {
        operations.forEach((apply) => {
          apply();
        });
        return Promise.resolve();
      },
    };
  }

  /**
   * Casts this class instance to Firestore for dependency injection.
   */
  asFirestore(): Firestore {
    return this as unknown as Firestore;
  }
}
