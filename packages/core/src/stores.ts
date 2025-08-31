import { SemVer } from "@scryhub/protocol";
import { LIBRARIES_KEY } from "./settings/storage";

/**
 * An LGS Provider
 */
export type StoreEntry = { 
  key: string;
   name: string; 
   enabled: boolean; 
};

export type CompatibilityCache = {
  /**
   * Whether the library is compatible with the core's protocol or not
   */
  isCompatible: boolean;
  /**
   * When this was evaluated last
   */
  lastEvaluatedTime?: number;
  /**
   * The protocol version if one was available to display
   */
  protocolVersion?: SemVer;
}


export type LGSLibrary = {
  id: string;             // provider extension ID
  name?: string;          // friendly label you set
  stores: StoreEntry[];
  compatiblity?: CompatibilityCache;
};
export type Settings = { providers: LGSLibrary[] };


/**
 * @returns a list of registered LGSLibrary extensions
 */
export function loadLibraries(): Promise<LGSLibrary[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(LIBRARIES_KEY, (obj) => {
      const arr = (obj?.[LIBRARIES_KEY] as LGSLibrary[]) || [];
      resolve(arr);
    });
  });
}
