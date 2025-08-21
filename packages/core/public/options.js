/**
 * Our internal message type so the BG worker asks for data on our behalf:
 * {
 *  type: HUB_GET_STORES,
 *  libraryId: string
 * }
 */
const HUB_GET_STORES = "hub.getLibraryStores";

// ---- storage helpers ----
const STORAGE_KEY = "scryhub.providers";

async function getSettings() {
  const { [STORAGE_KEY]: providers = [] } = await chrome.storage.sync.get(STORAGE_KEY);
  return { providers };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings.providers });
}

// ---- provider messaging from options page ----

/**
 * Tries to fetch store info from a given extension
 * @param {string} libraryId id of the library
 * @param {number} timeoutMs how long to wait
 * @returns a ListStoresResp object
 */
function listStores(libraryId, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { 
      if (!done) { 
        done = true; resolve({ ok: false, error: "timeout" }); 
      } 
    }, timeoutMs);

    const bgWorkerGetStores = {
      type: HUB_GET_STORES,
      libraryId
    };

    chrome.runtime.sendMessage(bgWorkerGetStores, (resultEnvelope) => {
      if (done) { 
        return; 
      }
      clearTimeout(t);
      
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        
        if(resultEnvelope.ok) {
          // this would be the ListStoresResp
          const unwrapped = resultEnvelope.data;
          resolve(unwrapped);
        }
        else {
          resolve({ ok: false, error: 'not known ' + resultEnvelope});
        }
      }
    });
  });
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

async function render() {
  const { providers } = await getSettings();
  $providers.innerHTML = "";

  if (!providers.length) {
    $providers.appendChild(createElement("div", { class: "muted" }, [
      document.createTextNode("No providers yet. Add one using the form above.")
    ]));
    return;
  }

  // TODO protocol update settings

  providers.forEach((prov, index) => {

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
          const settings = await getSettings();
          const p = settings.providers.find(p => p.id === prov.id);
          if (!p) { return; }
          const s = p.stores.find(st => st.key === store.key);
          if (!s) { return; }
          s.enabled = checkbox.checked;
          await saveSettings(settings);
        });

        const logo = store.logoUrl ? createElement("img", { src: store.logoUrl, alt: "" }) : null;
        const row = createElement("div", { class: "store" }, [
          checkbox,
          logo || createElement("span"),
          createElement("span", {}, [document.createTextNode(store.name || store.key)]),
          // show the internal key in the provider for debug reasons
          createElement("span",{ class: "muted kbd"}, [document.createTextNode(store.key)])
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

async function addProvider() {
  const id = $provId.value.trim();
  if (!id) {return;}
  $addBtn.disabled = true;
  try {
    const resp = await listStores(id, 6000);
    if (!resp?.ok) {
      alert(`Failed to reach provider:\n${resp?.error || "unknown error"}`);
      return;
    }

    // Merge into settings (dedupe by provider id)
    const { providers } = await getSettings();
    const stores = (resp.stores || []).map(s => ({
      key: s.key, name: s.name,
      enabled: true,
      logoUrl: s.logoUrl, logoSvg: s.logoSvg
    }));

    const existing = providers.find(p => p.id === id);
    if (existing) {
      existing.name = $provName.value.trim() || existing.name;
      existing.protocolVersion = resp.protocolVersion || existing.protocolVersion;
      existing.capabilities = resp.capabilities || existing.capabilities;
      existing.stores = stores;
    } else {
      providers.push({
        id,
        name: $provName.value.trim() || undefined,
        protocolVersion: resp.protocolVersion,
        capabilities: resp.capabilities || [],
        stores,
      });
    }
    await saveSettings({ providers });
    $provId.value = "";
    $provName.value = "";
    await render();
  } finally {
    $addBtn.disabled = false;
  }
}

async function refreshProvider(id) {
  const resp = await listStores(id, 6000);
  if (!resp?.ok) { alert(`Refresh failed: ${resp?.error || "unknown error"}`); return; }
  const { providers } = await getSettings();
  const p = providers.find(x => x.id === id);
  if (!p) return;
  p.protocolVersion = resp.protocolVersion || p.protocolVersion;
  p.capabilities = resp.capabilities || p.capabilities;
  const freshKeys = new Set((resp.stores || []).map(s => s.key));
  // keep previous enabled flags when keys match
  p.stores = (resp.stores || []).map(s => {
    const prev = (p.stores || []).find(ps => ps.key === s.key);
    return {
      key: s.key,
      name: s.name,
      enabled: prev ? !!prev.enabled : true,
      logoUrl: s.logoUrl,
      logoSvg: s.logoSvg
    };
  });
  await saveSettings({ providers });
  await render();
}

async function removeProvider(id) {
  const { providers } = await getSettings();
  console.log('removing', id);
  const next = providers.filter(p => p.id !== id);
  await saveSettings({ providers: next });
  await render();
}

// Wire up
document.addEventListener("DOMContentLoaded", () => {
  $addBtn.addEventListener("click", addProvider);
  render();
});
