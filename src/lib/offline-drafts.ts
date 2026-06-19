const DB_NAME = "nrlm-offline-cache";
const DB_VERSION = 1;
const STORE_NAME = "activityDrafts";
const LEGACY_LOCAL_STORAGE_KEY = "nrlm_activities_drafts";

export type ActivityDraft = Record<string, unknown> & {
  id: string;
};

const canUseIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const getLegacyDrafts = (): ActivityDraft[] => {
  if (typeof window === "undefined") return [];

  try {
    const cachedDrafts = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (!cachedDrafts) return [];
    const parsed = JSON.parse(cachedDrafts);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLegacyDrafts = (drafts: ActivityDraft[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(drafts));
};

const openDraftDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline cache."));
  });

const runDraftStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void,
) => {
  const db = await openDraftDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    let result: T;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error ?? new Error("Offline cache operation failed."));
    }

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Offline cache transaction failed."));
    };
  });
};

export const getActivityDrafts = async (): Promise<ActivityDraft[]> => {
  const legacyDrafts = getLegacyDrafts();

  if (!canUseIndexedDb()) return legacyDrafts;

  try {
    const drafts = await runDraftStore<ActivityDraft[]>("readonly", (store) => store.getAll());

    if (drafts.length === 0 && legacyDrafts.length > 0) {
      await saveActivityDrafts(legacyDrafts);
      return legacyDrafts;
    }

    return drafts;
  } catch {
    return legacyDrafts;
  }
};

export const saveActivityDrafts = async (drafts: ActivityDraft[]) => {
  saveLegacyDrafts(drafts);

  if (!canUseIndexedDb()) return;

  await runDraftStore<void>("readwrite", (store) => {
    store.clear();
    drafts.forEach((draft) => store.put(draft));
  });
};

export const addActivityDraft = async (draft: ActivityDraft) => {
  const currentDrafts = await getActivityDrafts();
  const updatedDrafts = [draft, ...currentDrafts.filter((item) => item.id !== draft.id)];
  await saveActivityDrafts(updatedDrafts);
  return updatedDrafts;
};

export const clearActivityDrafts = async () => {
  await saveActivityDrafts([]);
};
