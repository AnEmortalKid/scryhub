/**
 * Calls the background worker for data
 * 
 * Always resolves with an object containing an { ok: boolean }
 * with optionally an additional { data : T } with the result of the call
 * 
 * @param {string} type message type from options-api
 * @param {object} payload data expected by message defaults empty
 * @param {*} timeoutMs how long to wait for a response
 * 
 */
function callHub(type, payload = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve({ ok: false, error: "timeout" }); } }, timeoutMs);
    try {
      chrome.runtime.sendMessage({ type, ...payload }, (resp) => {
        if (done) return;
        clearTimeout(t);
        if (chrome.runtime.lastError) return resolve({ ok: false, error: chrome.runtime.lastError.message });
        resolve({ ok: true, data: resp } ?? { ok: false, error: "no_response" });
      });
    } catch (e) {
      clearTimeout(t);
      resolve({ ok: false, error: String(e?.message || e) });
    }
  });
}

// keep consistent
const HUB_OPTIONS_MESSAGES = {
  GET_LIBRARIES: "scryhub.core.getLibraries",
  ADD_LIBRARY: "scryhub.core.addLibrary",
  REMOVE_LIBRARY: "scryhub.core.removeLibrary",
  REFRESH_STORES: "scryhub.core.refreshStores",
  CHECK_COMPATIBILITY_FOR_LIB: "scryhub.core.checkLibraryCompatibility",
  TOGGLE_STORE: "scryhub.core.toggleStore",
};


/**
 * Unwraps the response from our RPC call to the background worker
 * @param {Object} result expected with { ok: boolean, data: { libraries: [] }}
 * @returns 
 */
function unwrapOptionsOperationResponse(result) {
  return result.ok ? result.data.libraries : Promise.reject(result.error);
}

/**
 * Api used by the options page to call the ScryHub background worker for data
 */
const HubApi = {
  getLibraries() {
    return callHub(HUB_OPTIONS_MESSAGES.GET_LIBRARIES).then(unwrapOptionsOperationResponse);
  },

  addLibrary(library) {
    return callHub(HUB_OPTIONS_MESSAGES.ADD_LIBRARY, library).then(unwrapOptionsOperationResponse);
  },

  removeLibrary(libraryId) {
    return callHub(HUB_OPTIONS_MESSAGES.REMOVE_LIBRARY, { id: libraryId }).then(unwrapOptionsOperationResponse);
  },

  refreshStores(libraryId) {
    return callHub(HUB_OPTIONS_MESSAGES.REFRESH_STORES, { id: libraryId }).then(unwrapOptionsOperationResponse);
  },

  checkCompatibility(libraryId) {
    return callHub(HUB_OPTIONS_MESSAGES.CHECK_COMPATIBILITY_FOR_LIB, { id: libraryId }).then(unwrapOptionsOperationResponse);
  },

  toggleStore(libraryId, storeKey) {
    return callHub(HUB_OPTIONS_MESSAGES.TOGGLE_STORE, { id: libraryId, storeKey }).then(unwrapOptionsOperationResponse);
  }

  // toggle store
  // check all compatibilities
}


// ---- UI rendering ----
const $providers = document.getElementById("providers");
const $provId = document.getElementById("provId");
const $provName = document.getElementById("provName");
const $addBtn = document.getElementById("addBtn");

/**
 * Creates an element in the current document
 * @param {string} tag the tag for the element
 * @param {Object} attributes any attributes to set
 * @param {Array} children any children to append to the element
 * @returns 
 */
function createElement(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(attributes).forEach(([k, v]) => {
    if (k === "class") {
      node.className = v;
    }
    else if (k === "html") {
      node.innerHTML = v;
    }
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2), v);
    }
    else node.setAttribute(k, v);
  });

  children.forEach((c) => node.appendChild(c));
  return node;
}


async function renderLibraries(libraries) {
  $providers.innerHTML = "";

  if (!libraries.length) {
    $providers.appendChild(createElement("div", { class: "muted" }, [
      document.createTextNode("No providers yet. Add one using the form above.")
    ]));
    return;
  }

  // TODO protocol update settings

  libraries.forEach((prov, index) => {

    /**
     * Make a header with the extension friendly name and id
     */
    const header = createElement("div", { class: "grid" }, [
      createElement("div", {}, [
        createElement("div", { class: "row" }, [
          createElement("b", {}, [document.createTextNode(prov.name || prov.id)]),
          // create a pill with the id
          createElement("span", { class: "pill" }, [document.createTextNode(prov.id)])
        ])
      ]),
      // buttons on the right
      createElement("div", {}, [
        createElement("button", { class: "small", onclick: () => refreshProvider(prov.id) }, [document.createTextNode("Refresh stores")]),
        createElement("button", { class: "small", style: "margin-left:8px", onclick: () => checkCompatibility(prov.id) }, [document.createTextNode("Check Compatibility")]),
        createElement("button", { class: "small", style: "margin-left:8px", onclick: () => removeProvider(prov.id) }, [document.createTextNode("Remove")])
      ])
    ]);

    // hold all our children
    const list = createElement("div");
    if (!prov.stores?.length) {
      list.appendChild(createElement("div", { class: "muted" }, [document.createTextNode("No stores discovered (yet).")]));
    } else {
      prov.stores.forEach((store, sIdx) => {
        const checkbox = createElement("input", { type: "checkbox" });
        checkbox.checked = !!store.enabled;
        // wire our enable/disable
        checkbox.addEventListener("change", async () => {
          toggleStore(prov.id, store.key);
        });

        const row = createElement("div", { class: "store" }, [
          checkbox,
          createElement("span"),
          createElement("span", {}, [document.createTextNode(store.name || store.key)]),
          // show the internal key in the provider for debug reasons
          createElement("span", { class: "muted kbd" }, [document.createTextNode(store.key)])
        ]);
        list.appendChild(row);
      });
    }

    const card = createElement("div", { class: "provider-card" }, [
      header,
      list,
    ]);
    $providers.appendChild(card);
  });
}

async function render() {
  // Render ALWAYS operates on the stored library information to render
  // Then it uses RPCS to update stuff instead of saving data itself (i think that works)
  const libraries = await HubApi.getLibraries();
  renderLibraries(libraries);
}

async function addProvider() {
  const id = $provId.value.trim();
  const provName = $provName.value.trim();
  if (!id) {
    return;
  }
  
  $addBtn.disabled = true;
  try {
    const updatedLibs = await HubApi.addLibrary({
      id: id,
      name: provName
    });

    renderLibraries(updatedLibs);
  } finally {
    $addBtn.disabled = false;
  }
}

async function refreshProvider(id) {
  const updatedLibs = await HubApi.refreshStores(id);
  renderLibraries(updatedLibs);
}

async function removeProvider(id) {
  const updatedLibs = await HubApi.removeLibrary(id);
  renderLibraries(updatedLibs);
}

async function checkCompatibility(id) {
  const updatedLibs = await HubApi.checkCompatibility(id);
  renderLibraries(updatedLibs);
}

async function toggleStore(libraryId, storeKey) {
  const updatedLibs = await HubApi.toggleStore(libraryId, storeKey);
  renderLibraries(updatedLibs);
}

// Wire up
document.addEventListener("DOMContentLoaded", () => {
  $addBtn.addEventListener("click", addProvider);
  render();
});
