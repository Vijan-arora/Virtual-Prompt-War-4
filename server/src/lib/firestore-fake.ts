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

  reset(): void {
    this.store.clear();
  }

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

  batch(): {
    set(ref: FakeDocRef, data: DocData, options?: { merge?: boolean }): void;
    update(ref: FakeDocRef, data: DocData): void;
    commit(): Promise<void>;
  } {
    const operations: (() => void)[] = [];
    return {
      set: (ref, data, options) => {
        operations.push(() => {
          const collection = this.col(ref.collectionName);
          const existing = options?.merge === true ? (collection.get(ref.id) ?? {}) : {};
          const merged = { ...existing };
          for (const [key, val] of Object.entries(data)) {
            merged[key] = resolveValue(existing[key], val);
          }
          collection.set(ref.id, merged);
        });
      },
      update: (ref, data) => {
        operations.push(() => {
          const collection = this.col(ref.collectionName);
          const existing = collection.get(ref.id) ?? {};
          const merged = { ...existing };
          for (const [key, val] of Object.entries(data)) {
            merged[key] = resolveValue(existing[key], val);
          }
          collection.set(ref.id, merged);
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

  asFirestore(): Firestore {
    return this as unknown as Firestore;
  }
}
