/**
 * Enriches the scryfall page with the buy this card placeholder for multiple providers
 */

import { CardLookupDescriptor, CardLookupResp, CardLoookupResultFound } from "@scryhub/protocol";
import { ProviderEntry, STORAGE_KEY } from "./stores";
import { Result } from "./messaging";


export type ScryHubLookupCardMsg = {
  type: "hub.lookupSpecific",
  libraryId: string,
  storeKey: string,
  descriptor: CardLookupDescriptor,
}

/**
 * Inner types just to have the right keys
 */
type SetAndCollector = Pick<CardLookupDescriptor, 'setCode' | 'collectorNumber'>;
type TitleAndBorder = Pick<CardLookupDescriptor, 'scryfallTitle' | 'borderTreatment'>;

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


/**
 * Reads the name from `<span class="card-text-card-name">`
 */
function getDisplayedCardName(): string {
  const nameSpan = document.querySelector<HTMLElement>('span.card-text-card-name');

  if (nameSpan) {
    return nameSpan.textContent.trim();
  }

  // not found probably need other approaches later
  return "";
}

function getTitleAndBorder(): TitleAndBorder {
  const img = document.querySelector<HTMLImageElement>('.card-image-front img');

  if (!img) {
    return {};
  }

  const title = img.title.trim();

  let borderTreatment = undefined;
  for (const cls of img.classList) {
    if (cls.startsWith('border-')) {
      borderTreatment = cls.slice('border-'.length); // e.g. "borderless", "black", "white", "silver"
    }
  }

  return {
    scryfallTitle: title,
    borderTreatment: borderTreatment
  }
}

/**
 * Reads the set code and collector number from the printss-table, currently selected row
 * Parses through the card link, example: `<a href="/card/fin/404/yuna-hope-of-spira">`
 * 
 * @returns the setCode and collector number
 */
function getSetAndCollectorFromTable(): SetAndCollector {
  // find the current row, it usually is a link to this same page
  const currentRowLink = document.querySelector<HTMLAnchorElement>(
    '.prints-table tr.current td a[href^="/card/"]'
  );

  if (!currentRowLink) return {
    setCode: undefined, collectorNumber: undefined
  };

  const parts = currentRowLink.getAttribute('href')!.split('/');
  // /card/fin/404/yuna-hope-of-spira → ["", "card", "fin", "404", "yuna-hope-of-spira"]
  return {
    setCode: parts[2].toUpperCase(),       // "FIN"
    collectorNumber: parts[3] // "404"
  };
}

/**
 * Parses the various pieces of the dom to get the attributes we need
 */
function getCardDescriptor(): CardLookupDescriptor {
  const cardName = getDisplayedCardName();
  const setCodeAndCollector = getSetAndCollectorFromTable();
  const titleAndBorder = getTitleAndBorder();

  return {
    name: cardName,
    ...setCodeAndCollector,
    ...titleAndBorder
  };
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

async function renderProvidersForCard(listEl: HTMLUListElement, descriptor: CardLookupDescriptor) {
  const libraries = await loadProviders();
  if (!libraries.length) {
    return;
  }

  // Create one LI per enabled store (per LGSLibrary)
  for (const library of libraries) {
    const enabledStores = (library.stores || []).filter(s => s.enabled);
    for (const store of enabledStores) {
      const label = store.name || `${library.name || library.id} — ${store.key}`;
      const { li, a, priceEl } = makeStoreLi(label, store.logoUrl);
      listEl.appendChild(li);

      // Ask BG to query this specific provider/store
      const hubLookup: ScryHubLookupCardMsg = {
        type: "hub.lookupSpecific",
        libraryId: library.id,
        storeKey: store.key,
        descriptor,
      }

      chrome.runtime.sendMessage(hubLookup, (resp: Result<CardLookupResp>) => {
        if (!resp || resp.ok === false || !resp.data) {
          populateButtonNotFound(priceEl);
          return;
        }

        const lookupResponse: CardLookupResp = resp.data;
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
    if (!sec) {
      return;
    }

    const cardDescriptor = getCardDescriptor();
    renderProvidersForCard(sec.list, cardDescriptor);
  });

  // Re-run on PJAX
  const _ps = history.pushState; const _rs = history.replaceState;
  const rerun = () => { if (onCardPage()) ensureHubSection(); };
  history.pushState = function (...a) { _ps.apply(this, a as any); rerun(); };
  history.replaceState = function (...a) { _rs.apply(this, a as any); rerun(); };
  window.addEventListener("popstate", rerun);
})();
