/**
 * Local storage for timestamp history using IndexedDB
 * All data stays on the user's device
 */

const DB_NAME = "hashstamp"
const DB_VERSION = 1
const STORE_NAME = "timestamps"

export interface TimestampRecord {
  id: string
  fileName: string
  fileSize: number
  hash: string
  timestamp: string
  otsUrl?: string
}

/**
 * Open the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("timestamp", "timestamp", { unique: false })
        store.createIndex("hash", "hash", { unique: false })
      }
    }
  })
}

/**
 * Save a timestamp record to history
 */
export async function saveToHistory(
  record: Omit<TimestampRecord, "id">
): Promise<TimestampRecord> {
  const db = await openDB()
  const id = crypto.randomUUID()
  const fullRecord: TimestampRecord = { ...record, id }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(fullRecord)

    request.onsuccess = () => {
      resolve(fullRecord)
    }

    request.onerror = () => {
      reject(new Error("Failed to save record"))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Get all timestamp records from history
 * Returns records sorted by timestamp (newest first)
 */
export async function getHistory(): Promise<TimestampRecord[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("timestamp")
    const request = index.openCursor(null, "prev")

    const records: TimestampRecord[] = []

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        records.push(cursor.value)
        cursor.continue()
      } else {
        resolve(records)
      }
    }

    request.onerror = () => {
      reject(new Error("Failed to get history"))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Delete a timestamp record from history
 */
export async function deleteFromHistory(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error("Failed to delete record"))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Find a record by hash
 */
export async function findByHash(hash: string): Promise<TimestampRecord | null> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("hash")
    const request = index.get(hash)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(new Error("Failed to find record"))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error("Failed to clear history"))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}
