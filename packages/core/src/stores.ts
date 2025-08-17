
/**
 * An LGS Provider
 */
export type StoreEntry = { key: string; name: string; enabled: boolean; logoUrl?: string; logoSvg?: string };

export type LGSLibrary = {
  id: string;             // provider extension ID
  name?: string;          // friendly label you set
  protocolVersion?: string;
  capabilities?: string[];
  stores: StoreEntry[];
};
export type Settings = { providers: LGSLibrary[] };


// TODO keep in sync with options.js
export const STORAGE_KEY = "scryhub.providers";


/**
 * @returns a list of registered LGSLibrary extensions
 */
export function loadLibraries(): Promise<LGSLibrary[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (obj) => {
      const arr = (obj?.[STORAGE_KEY] as LGSLibrary[]) || [];
      resolve(arr);
    });
  });
}