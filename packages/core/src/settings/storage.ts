import { SemVer } from "@scryhub/protocol";
import { checkProtocolFromExtension } from "../messaging/library";
import { CompatibilityCache, LGSLibrary } from "../stores"
import { getLibraryProtocol } from "../messaging/internal";

// TODO swap to libraries
export const LIBRARIES_KEY = "scryhub.providers";

// TODO dynamic resolve
export const MY_PROTOCOL_VERSION: SemVer = "0.1.0";

// 5 mins
export const COMPATIBILITY_TTL = 5 * 60 * 1000;

export type Settings = {
    libraries: LGSLibrary[]
}

function isCompatibleProtocol(libraryProtocol: SemVer) {
    const libMajor = libraryProtocol.split('.')[0];
    const myMajor = MY_PROTOCOL_VERSION.split('.')[0];

    return libMajor == myMajor;
}

export function isLibraryComptible(library: LGSLibrary) {
    if (library.compatiblity) {
        return library.compatiblity.isCompatible;
    }

    console.warn('[ScryHub]', 'compatibility check on library without compatibility field');
    return false;
}

function shouldCheckCompatibility(currentTime: number, lastEvaluatedTime?: number): boolean {
    // no data boss
    if (!lastEvaluatedTime) {
        return true;
    }

    // has it been long enough
    return (currentTime - lastEvaluatedTime) > COMPATIBILITY_TTL;
}

export async function saveLibraries(libraries: LGSLibrary[]) {
    await chrome.storage.sync.set({ [LIBRARIES_KEY]: libraries });
}

/**
 * @returns all libraries regardless of compatibility
 */
export async function getStoredLibraries(): Promise<LGSLibrary[]> {
    // chrome returns an object { "scryhub.libraries": [] }
    const objWithKey = await chrome.storage.sync.get(LIBRARIES_KEY);
    return objWithKey[LIBRARIES_KEY] || []
}

/**
 * Attempts to get the protocol version for a library
 * @param libraryId the id of the library
 * @param requestViaBackground whether this request needs routing through the background worker or not
 */
async function getLibraryProtocolRouter(libraryId: string, requestViaBackground: boolean) {
    if (requestViaBackground) {
        return await getLibraryProtocol(libraryId);
    }

    // use external call directly
    return await checkProtocolFromExtension(libraryId);
}

/**
 * Checks whether the given library is compatible with our protocol version or not
 * @param library the library to check for compatibility
 * @param respectTTL whether we should avoid checking based on ttl or not
 * @param useBackgroundWorker whether we should use the background service worker to request data or not,
 *  should be sent as false when we are already responding in a background request context to avoid re-sending messages to ourselves
 *  and having the listener fail to respond (it was busy processing its own message that initiates the call)
 */
export async function performCompatibilityCheck(library: LGSLibrary, respectTTL = true, requestViaBackground = true) {
    const now = new Date().getTime();

    const defaultEmpty = {
        isCompatible: false, lastEvaluatedTime: undefined,
        protocolVersion: undefined
    } as CompatibilityCache;

    const libCompatCache = library.compatiblity ?? defaultEmpty
    // set the ref
    library.compatiblity = libCompatCache;

    // don't check if we wanna uphold the ttl
    if (respectTTL && !shouldCheckCompatibility(now, libCompatCache.lastEvaluatedTime)) {
        return;
    }

    console.log('[ScryHub]', 'running compatibility for library', library.id);
    const libProtocolEnvelope = await getLibraryProtocolRouter(library.id, requestViaBackground);
    console.log('[ScryHub]', 'evaluating compatibility response', libProtocolEnvelope);
    libCompatCache.lastEvaluatedTime = now;
    // not fine , disable until future check
    if (!libProtocolEnvelope.ok) {
        libCompatCache.isCompatible = false;
        return;
    }

    const libProtocolResponse = libProtocolEnvelope.data;
    if (!libProtocolResponse.ok) {
        libCompatCache.isCompatible = false;
        return;
    }

    const libProtocolVersion = libProtocolResponse.protocolVersion;
    libCompatCache.isCompatible = isCompatibleProtocol(libProtocolVersion);
    libCompatCache.protocolVersion = libProtocolVersion;
}

/**
 * Updates the compatibility of stored libraries and returns the set of libraries, only performs check if out of date
 * 
 * Intended to be called by the content script to ignore libraries that are not compatible
 * before we ask them for other data.
 * 
 * @returns the libraries after updating compatibilities
 */
export async function updateCompatibilitiesIfNeeded(): Promise<LGSLibrary[]> {
    return await updateCompatibilitiesInternal(true);
}

/**
 * Force updates the compatibility of stored libraries and returns the set of libraries
 * 
 * Intended to be called by the options script to force a refresh when the options page first loads
 * 
 * @returns the libraries after updating compatibilities
 */
export async function updateCompatibilitiesForced(): Promise<LGSLibrary[]> {
    return await updateCompatibilitiesInternal(false);
};

/**
 * Updates the compatibility of stored libraries and returns the set of libraries, 
 * use forceCheck to either ignore the TTL or enforce it
 * 
 * @returns the libraries after updating compatibilities
 */
async function updateCompatibilitiesInternal(enforceTTL: boolean) {
    // nothing to do if empty
    const storedLibs = await getStoredLibraries();
    if (storedLibs.length == 0) {
        return [];
    }

    for (const library of storedLibs) {
        await performCompatibilityCheck(library, enforceTTL);
    }

    // save em
    saveLibraries(storedLibs);

    return storedLibs;
}