// utils/indexedDB.ts


export const openDB = (dbName: string, storeName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = (event) => reject(event);
    request.onsuccess = (event) => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      db.createObjectStore(storeName, { keyPath: 'key' });
    };
  });
};

export const getItem = (dbName: string, storeName: string, key: string): Promise<any> => {
  return openDB(dbName, storeName).then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = (event) => reject(event);
      request.onsuccess = (event) => resolve(request.result?.value);
    });
  });
};

export const setItem = (dbName: string, storeName: string, key: string, value: any): Promise<void> => {
  return openDB(dbName, storeName).then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ key, value });
      request.onerror = (event) => reject(event);
      request.onsuccess = (event) => resolve();
    });
  });
};
