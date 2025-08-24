/**
 * Contains code that handles the options-api
 * from the background
 */

import { ListStoresResponse } from "@scryhub/protocol";
import { listStoresFromExtension, Result } from "../messaging/library";
import { OptionCheckLibraryCompatibilityResponse, OptionsAddLibraryRequest, OptionsAddLibraryResponse as OptionsAddLibraryResponse, OptionsCheckLibraryCompatibilityRequest, OptionsGetLibraryRequest, OptionsGetLibraryResponse, OptionsRefreshStoresRequest, OptionsRefreshStoresResponse, OptionsRemoveLibraryRequest, OptionsRemoveLibraryResponse, OptionsToggleStoreRequest, OptionsToggleStoreResponse } from "../messaging/options-api";
import { getStoredLibraries, isLibraryComptible, performCompatibilityCheck, saveLibraries } from "../settings/storage";
import { LGSLibrary, loadLibraries, StoreEntry } from "../stores";
import { createLogger } from "../logger/factory";

const bgOptsLogger = createLogger('[ScryHub.Background.Options]');

export async function fetchStoredLibraries(msg: OptionsGetLibraryRequest): Promise<OptionsGetLibraryResponse> {
    const libs = await loadLibraries();
    return {
        libraries: libs
    }
};

async function getStoresForCompatibleLibrary(libraryId: string): Promise<StoreEntry[]> {
    bgOptsLogger.log('getStores for compatible library', libraryId);
    // get the stores for the lib directly since we are already in the background
    const storesForLibResult: Result<ListStoresResponse> = await listStoresFromExtension(libraryId);
    if (!storesForLibResult.ok) {
        return Promise.reject({ ok: false, error: 'did not receive a response for getLibraryStores' });
    }

    const storesForLibraryResponse = storesForLibResult.data;
    if (!storesForLibraryResponse.ok) {
        return Promise.reject({ ok: false, error: 'did not receive an ok for getLibraryStores' });
    }

    const storesForLibrary = storesForLibraryResponse.stores;
    // convert to internal
    const asStoreEntries: StoreEntry[] = storesForLibrary.map(storeMeta => {
        return {
            key: storeMeta.key,
            name: storeMeta.name,
            enabled: true
        }
    });

    return asStoreEntries;
}

export async function addLibrary(msg: OptionsAddLibraryRequest): Promise<OptionsAddLibraryResponse> {
    const newLibId = msg.id;
    const newLibName = msg.name;
    bgOptsLogger.log('adding library', newLibId, '|', newLibName ?? '');

    const newLgsLibrary: LGSLibrary = {
        id: newLibId,
        name: newLibName,
        // will override
        stores: []
    };

    // force the check , with direct messages since we are in background already
    await performCompatibilityCheck(newLgsLibrary, false, false);


    // if its compatible go get the stores otherwise save it as incompatible no data
    const storedLibraries = await getStoredLibraries();

    if (isLibraryComptible(newLgsLibrary)) {
        const storesFromLib: StoreEntry[] = await getStoresForCompatibleLibrary(newLgsLibrary.id);
        newLgsLibrary.stores = storesFromLib;
    }

    // deduplicate by provider if we re-added the same thing
    const existing = storedLibraries.find(lib => lib.id === newLibId);
    if (existing) {
        // override state
        existing.stores = newLgsLibrary.stores;
    }
    else {
        storedLibraries.push(newLgsLibrary);
    }

    await saveLibraries(storedLibraries);

    return Promise.resolve({ libraries: storedLibraries });
}

export async function removeLibrary(msg: OptionsRemoveLibraryRequest): Promise<OptionsRemoveLibraryResponse> {
    const libToRemoveId = msg.id;
    bgOptsLogger.log('removing library', libToRemoveId);

    const storedLibraries = await getStoredLibraries();
    const pruned = storedLibraries.filter(lib => lib.id !== libToRemoveId);
    await saveLibraries(pruned);

    return Promise.resolve({ libraries: pruned });
}

export async function refreshStores(msg: OptionsRefreshStoresRequest): Promise<OptionsRefreshStoresResponse> {
    const libToRefreshId = msg.id;
    bgOptsLogger.log('refreshing stores for', libToRefreshId);

    const storedLibraries = await getStoredLibraries();
    const storeToRefresh = storedLibraries.find((lib) => lib.id === libToRefreshId);
    if (!storeToRefresh) {
        return Promise.reject({ ok: false, error: 'Attempted to refresh store for unkown id ' + libToRefreshId })
    }

    // check if compatible otherwise we may not get stores
    await performCompatibilityCheck(storeToRefresh, false, false);

    if (!isLibraryComptible(storeToRefresh)) {
        bgOptsLogger.log('cannot refresh stores from incompatible library', libToRefreshId);
        // no change could be performed
        return Promise.resolve({ libraries: storedLibraries });
    }

    // get info up to date
    const storesFromLib: StoreEntry[] = await getStoresForCompatibleLibrary(libToRefreshId);
    storeToRefresh.stores = storesFromLib;

    await saveLibraries(storedLibraries);
    return Promise.resolve({ libraries: storedLibraries });
}


export async function recheckCompatibility(msg: OptionsCheckLibraryCompatibilityRequest): Promise<OptionCheckLibraryCompatibilityResponse> {
    const libToCheckId = msg.id;
    bgOptsLogger.log('rechecking compatibility for', libToCheckId);

    const storedLibraries = await getStoredLibraries();
    const storeToRecheck = storedLibraries.find((lib) => lib.id === libToCheckId);
    if (!storeToRecheck) {
        return Promise.reject({ ok: false, error: 'Attempted to check compatibility for unkown id ' + libToCheckId })
    }

    // force check using direct call
    await performCompatibilityCheck(storeToRecheck, false, false);

    await saveLibraries(storedLibraries);
    return Promise.resolve({ libraries: storedLibraries });
}

export async function toggleStore(msg: OptionsToggleStoreRequest): Promise<OptionsToggleStoreResponse> {
    const libToToggleStoreFor = msg.id;
    const storeToToggle = msg.storeKey;
    bgOptsLogger.log('toggling store', storeToToggle, 'from library', libToToggleStoreFor);

    const storedLibraries = await getStoredLibraries();
    const libraryWithStore = storedLibraries.find((lib) => lib.id === libToToggleStoreFor);

    const storeInLibrary = libraryWithStore?.stores.find((store) => store.key === storeToToggle);
    if (!storeInLibrary) {
        return Promise.reject({ ok: false, error: 'Attempted to toggle unknown store ' + storeToToggle + ' in library ' + libToToggleStoreFor });
    }

    // toggle it
    storeInLibrary.enabled = !storeInLibrary.enabled;

    await saveLibraries(storedLibraries);
    return Promise.resolve({ libraries: storedLibraries });
}