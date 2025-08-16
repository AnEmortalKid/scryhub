// ---- minimal protocol constants (keep in sync with @scryhub/protocol) ----
const MSG_LIST_STORES = "scryhub.adapter.listStores";

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
function listStores(providerId, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve({ ok:false, error:"timeout" }); } }, timeoutMs);
    chrome.runtime.sendMessage(providerId, { type: MSG_LIST_STORES }, (resp) => {
      if (done) return;
      clearTimeout(t);
      if (chrome.runtime.lastError) {
        resolve({ ok:false, error: chrome.runtime.lastError.message });
      } else {
        resolve(resp || { ok:false, error:"no response" });
      }
    });
  });
}

// ---- UI rendering ----
const $providers = document.getElementById("providers");
const $provId = document.getElementById("provId");
const $provName = document.getElementById("provName");
const $addBtn = document.getElementById("addBtn");

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  children.forEach((c) => n.appendChild(c));
  return n;
}

async function render() {
  const { providers } = await getSettings();
  $providers.innerHTML = "";

  if (!providers.length) {
    $providers.appendChild(el("div", { class: "muted" }, [
      document.createTextNode("No providers yet. Add one using the form above.")
    ]));
    return;
  }

  providers.forEach((prov, index) => {
    const header = el("div", { class: "grid" }, [
      el("div", {}, [
        el("div", { class: "row" }, [
          el("b", { }, [ document.createTextNode(prov.name || prov.id) ]),
          prov.protocolVersion ? el("span", { class: "pill" }, [ document.createTextNode(`v${prov.protocolVersion}`) ]) : el("span"),
          prov.capabilities?.length ? el("span", { class: "pill" }, [ document.createTextNode(prov.capabilities.join(",")) ]) : el("span")
        ])
      ]),
      el("div", {}, [
        el("button", { class: "small", onclick: () => refreshProvider(prov.id) }, [ document.createTextNode("Refresh stores") ]),
        el("button", { class: "small", style: "margin-left:8px", onclick: () => removeProvider(prov.id) }, [ document.createTextNode("Remove") ])
      ])
    ]);

    const list = el("div");
    if (!prov.stores?.length) {
      list.appendChild(el("div", { class: "muted" }, [ document.createTextNode("No stores discovered (yet).") ]));
    } else {
      prov.stores.forEach((store, sIdx) => {
        const checkbox = el("input", { type: "checkbox" });
        checkbox.checked = !!store.enabled;
        checkbox.addEventListener("change", async () => {
          const settings = await getSettings();
          const p = settings.providers.find(p => p.id === prov.id);
          if (!p) return;
          const s = p.stores.find(st => st.key === store.key);
          if (!s) return;
          s.enabled = checkbox.checked;
          await saveSettings(settings);
        });

        const logo = store.logoUrl ? el("img", { src: store.logoUrl, alt: "" }) : null;
        const row = el("div", { class: "store" }, [
          checkbox,
          logo || el("span"),
          el("span", {}, [ document.createTextNode(store.name || store.key) ])
        ]);
        list.appendChild(row);
      });
    }

    const card = el("div", { class: "provider-card" }, [
      header,
      list,
    ]);
    $providers.appendChild(card);
  });
}

async function addProvider() {
  const id = $provId.value.trim();
  if (!id) return;
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
