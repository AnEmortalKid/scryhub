export type StoreEntry = { key: string; name: string; enabled: boolean; logoUrl?: string; logoSvg?: string };
export type ProviderEntry = {
  id: string;             // provider extension ID
  name?: string;          // friendly label you set
  protocolVersion?: string;
  capabilities?: string[];
  stores: StoreEntry[];
  showAsSeparateButtons?: boolean; // core-wide flag (optional per provider)
};
export type Settings = { providers: ProviderEntry[] };


// TODO keep in sync with options.js
export const STORAGE_KEY = "scryhub.providers";