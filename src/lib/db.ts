export interface SavedSlip {
  id?: number;
  timestamp: number;
  date: string;
  bankName?: string;
  logo?: string;
  logoScale?: number;
  branchName: string;
  branchCode: string;
  panNo: string;
  incDate: string;
  beneficiary: string;
  accountNo: string;
  depositorOffice: string;
  officeCode: string;
  energyBill: string;
  others: string;
  denominations: Record<string, string>;
  totalAmount: number;
}

export interface SavedBank {
  id?: number;
  bankName: string;
  accountNo: string;
  logo: string;
  logoScale?: number;
}

export interface SavedOffice {
  id?: number;
  depositorOffice: string;
  officeCode: string;
}

const DB_NAME = 'BankPayInSlipDB';
const STORE_NAME = 'slips';
const BANKS_STORE_NAME = 'banks';
const OFFICES_STORE_NAME = 'offices';
const SETTINGS_STORE_NAME = 'settings';
const DB_VERSION = 4;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(BANKS_STORE_NAME)) {
        db.createObjectStore(BANKS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(OFFICES_STORE_NAME)) {
        db.createObjectStore(OFFICES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

export const saveSettings = async (key: string, value: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getSettings = async (key: string): Promise<any | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      const result = req.result;
      resolve(result ? result.value : null);
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveOffice = async (office: SavedOffice): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFICES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(OFFICES_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const existing = (request.result as SavedOffice[]).find(o => o.depositorOffice === office.depositorOffice && o.officeCode === office.officeCode);
      if (existing && existing.id) {
        office.id = existing.id;
        const putReq = store.put(office);
        putReq.onsuccess = () => resolve(putReq.result as number);
        putReq.onerror = () => reject(putReq.error);
      } else {
        const addReq = store.add(office);
        addReq.onsuccess = () => resolve(addReq.result as number);
        addReq.onerror = () => reject(addReq.error);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllOffices = async (): Promise<SavedOffice[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFICES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(OFFICES_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteOffice = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFICES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(OFFICES_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveSlip = async (slip: SavedSlip): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(slip);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getAllSlips = async (): Promise<SavedSlip[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteSlip = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveBank = async (bank: SavedBank): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BANKS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BANKS_STORE_NAME);
    // Try to find existing bank with same name and account
    const request = store.getAll();
    request.onsuccess = () => {
      const existingBanks = request.result as SavedBank[];
      const existing = existingBanks.find(b => b.bankName === bank.bankName && b.accountNo === bank.accountNo);
      if (existing && existing.id) {
        bank.id = existing.id;
        const putReq = store.put(bank);
        putReq.onsuccess = () => resolve(putReq.result as number);
        putReq.onerror = () => reject(putReq.error);
      } else {
        const addReq = store.add(bank);
        addReq.onsuccess = () => resolve(addReq.result as number);
        addReq.onerror = () => reject(addReq.error);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllBanks = async (): Promise<SavedBank[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BANKS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(BANKS_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteBank = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BANKS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BANKS_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
