/**
 * Enriches the scryfall page with the buy this card placeholder for multiple providers
 */

import { CardLookupResp, CardLoookupResultFound } from "@scryhub/protocol";
import { ProviderEntry, STORAGE_KEY } from "./stores";
import { Result } from "./messaging";


function onCardPage() {
  const p = location.pathname.split("/").filter(Boolean);
  return p[0] === "card" && p.length >= 3;
}

function storesColumn(): HTMLElement | null {
  return document.querySelector("#stores");
}

function ensureHubSection(): { list: HTMLUListElement } | null {
  const col = storesColumn(); if (!col) return null;
  let sec = document.getElementById("scryhub-section");
  if (!sec) {
    sec = document.createElement("div");
    sec.id = "scryhub-section";
    sec.innerHTML = `<h6>Buy Locally (ScryHub)</h6><ul class="toolbox-links"></ul>`;
    sec.style = "padding: 20px 0px;"
    col.appendChild(sec);
  }
  return { list: sec.querySelector(".toolbox-links") as HTMLUListElement };
}

function getCardName(): string {
  const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
  const tw = document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || "";
  return (og || tw || document.title).replace(/·.*$/, "").trim();
}

function scheduleIdle(fn: () => void) {
  // be gentle: wait for paint, then idle
  if (document.readyState === "complete") {
    if ("requestIdleCallback" in window) (window as any).requestIdleCallback(() => fn(), { timeout: 2000 });
    else setTimeout(fn, 600);
  } else {
    window.addEventListener("load", () => scheduleIdle(fn), { once: true });
  }
}

function loadProviders(): Promise<ProviderEntry[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (obj) => {
      const arr = (obj?.[STORAGE_KEY] as ProviderEntry[]) || [];
      resolve(arr);
    });
  });
}

function makeStoreLi(label: string, logoUrl?: string) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.className = "button-n disabled";
  a.href = "#";
  a.tabIndex = -1;                // not focusable while disabled
  a.style.pointerEvents = "none"; // blocks clicks without listeners
  a.style.opacity = "0.6";

  if (logoUrl) {
    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = "";
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.verticalAlign = "middle";
    img.style.marginRight = "6px";
    a.appendChild(img);
  }

  const labelEl = document.createElement("i");
  labelEl.textContent = label;
  a.appendChild(labelEl);

  const price = document.createElement("span");
  // TODO handle currency
  price.className = "price currency-usd";
  price.textContent = "…";
  a.appendChild(price);

  li.appendChild(a);
  return { li, a, priceEl: price };
}

function populateButtonSuccess(a: HTMLAnchorElement, priceEl: HTMLElement, url: string, priceText?: string) {
  a.classList.remove("disabled");
  a.style.opacity = "";
  // remove block of events
  a.style.pointerEvents = "";
  a.href = url;
  a.target = "_blank";
  a.rel = "nofollow";
  priceEl.textContent = priceText || "";
}

function populateButtonNotFound(priceEl: HTMLElement) {
  priceEl.textContent = "Not found";
}

function formatMoney(m?: { amount: number; currency: string }) {
  if (!m) return undefined;
  try {
    // USD only for now
    return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency || "USD", minimumFractionDigits: 2 }).format(m.amount);
  } catch {
    return `$${m.amount.toFixed(2)}`;
  }
}

async function renderProvidersForCard(listEl: HTMLUListElement, cardName: string) {
  const providers = await loadProviders();
  if (!providers.length) return;

  // Create one LI per enabled store (per provider)
  for (const prov of providers) {
    const enabledStores = (prov.stores || []).filter(s => s.enabled);
    for (const store of enabledStores) {
      const label = store.name || `${prov.name || prov.id} — ${store.key}`;
      const { li, a, priceEl } = makeStoreLi(label, store.logoUrl);
      listEl.appendChild(li);

      // Ask BG to query this specific provider/store
      chrome.runtime.sendMessage({
        type: "hub.lookupSpecific",
        providerId: prov.id,
        storeKey: store.key,
        cardName,
      }, (resp : Result<CardLookupResp>) => {
        if (!resp || resp.ok === false || !resp.data) {
          populateButtonNotFound(priceEl);
          return;
        }

        const lookupResponse : CardLookupResp = resp.data;
        const result = lookupResponse.result as
          | CardLoookupResultFound | CardLoookupResultFound

        // TODO handle availability
        if (result.found && result.card?.url) {
          const priceText = formatMoney(result.card.price);
          populateButtonSuccess(a, priceEl, result.card.url, priceText);
        } else {
          populateButtonNotFound(priceEl);
        }
      });
    }
  }
}


(function boot() {
  if (!onCardPage()) return;
  const sec = ensureHubSection(); if (!sec) return;

  // build store sections per card
  scheduleIdle(() => {
    const sec = ensureHubSection();
    if (!sec) return;
    const cardName = getCardName();
    renderProvidersForCard(sec.list, cardName);
  });

  // Re-run on PJAX
  const _ps = history.pushState; const _rs = history.replaceState;
  const rerun = () => { if (onCardPage()) ensureHubSection(); };
  history.pushState = function (...a) { _ps.apply(this, a as any); rerun(); };
  history.replaceState = function (...a) { _rs.apply(this, a as any); rerun(); };
  window.addEventListener("popstate", rerun);
})();
