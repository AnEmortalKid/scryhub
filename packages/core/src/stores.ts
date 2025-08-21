
/**
 * An LGS Provider
 */
export type StoreEntry = { key: string; name: string; enabled: boolean; logoUrl?: string; logoSvg?: string };

export type CompatibilityCache = {
  /**
   * Whether the library is compatible with the core's protocol or not
   */
  isCompatible: boolean;
  /**
   * When this was evaluated last
   */
  lastEvaluatedTime?: number;
}


export type LGSLibrary = {
  id: string;             // provider extension ID
  name?: string;          // friendly label you set
  stores: StoreEntry[];
  compatiblity?: CompatibilityCache;
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
