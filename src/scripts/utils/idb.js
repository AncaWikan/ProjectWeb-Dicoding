const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const OBJECT_STORES = {
  stories: 'id',
  outbox: '++id',
};

function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IDB] Failed to open database');
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      console.log('[IDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('[IDB] Upgrading database...');

      for (const [storeName, keyPath] of Object.entries(OBJECT_STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath });
          console.log('[IDB] Created object store:', storeName);
        }
      }
    };
  });
}

export async function idbAdd(storeName, value) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.add(value);

    request.onsuccess = () => {
      console.log('[IDB] Added to', storeName, ':', value);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to add to', storeName);
      reject(new Error('Failed to add item'));
    };
  });
}

export async function idbPut(storeName, value) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.put(value);

    request.onsuccess = () => {
      console.log('[IDB] Put to', storeName, ':', value);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to put to', storeName);
      reject(new Error('Failed to put item'));
    };
  });
}

export async function idbGet(storeName, key) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.get(key);

    request.onsuccess = () => {
      console.log('[IDB] Got from', storeName, ':', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to get from', storeName);
      reject(new Error('Failed to get item'));
    };
  });
}

export async function idbGetAll(storeName) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      console.log('[IDB] Got all from', storeName, ':', request.result.length, 'items');
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to get all from', storeName);
      reject(new Error('Failed to get all items'));
    };
  });
}

export async function idbDelete(storeName, key) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.delete(key);

    request.onsuccess = () => {
      console.log('[IDB] Deleted from', storeName, '- Key:', key);
      resolve(true);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to delete from', storeName, '- Key:', key);
      reject(new Error('Failed to delete item'));
    };

    transaction.onerror = () => {
      console.error('[IDB] Transaction error during delete');
      reject(new Error('Transaction error'));
    };

    transaction.oncomplete = () => {
      console.log('[IDB] Delete transaction completed');
    };
  });
}

export async function idbClear(storeName) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.clear();

    request.onsuccess = () => {
      console.log('[IDB] Cleared', storeName);
      resolve(true);
    };

    request.onerror = () => {
      console.error('[IDB] Failed to clear', storeName);
      reject(new Error('Failed to clear store'));
    };
  });
}

export async function idbSearch(storeName, query) {
  const allItems = await idbGetAll(storeName);
  
  const lowerQuery = query.toLowerCase();
  return allItems.filter((item) => {
    const name = (item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    return name.includes(lowerQuery) || description.includes(lowerQuery);
  });
}

export async function idbSort(storeName, sortBy, order = 'asc') {
  const allItems = await idbGetAll(storeName);
  
  return allItems.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    
    if (typeof valA === 'string') {
      return order === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    
    if (order === 'asc') {
      return valA - valB;
    } else {
      return valB - valA;
    }
  });
}
