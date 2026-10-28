// Áudio das locuções salvas fica no IndexedDB (sem o limite de ~5 MB do localStorage).
// Todas as funções falham em silêncio: sem IndexedDB o app segue funcionando, só sem cache de áudio.

const DB_NAME = 'vozvarejo';
const STORE = 'audio';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => (dbPromise = null));
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[VozVarejo] IndexedDB indisponível:', e);
    return undefined;
  }
}

export const getAudio = (id: string) => run<string | undefined>('readonly', (s) => s.get(id));

export const putAudio = async (id: string, base64: string) => {
  await run('readwrite', (s) => s.put(base64, id));
};

export const deleteAudio = async (id: string) => {
  await run('readwrite', (s) => s.delete(id));
};

/** Remove áudios de locuções que não existem mais no histórico. */
export const pruneAudio = async (keepIds: string[]) => {
  const keys = (await run<IDBValidKey[]>('readonly', (s) => s.getAllKeys())) ?? [];
  const keep = new Set(keepIds);
  await Promise.all(keys.filter((k) => !keep.has(String(k))).map((k) => deleteAudio(String(k))));
};
