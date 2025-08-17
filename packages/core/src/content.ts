/**
 * Enriches the scryfall page with the buy this card placeholder for multiple providers
 */

import { CardLookupDescriptor, CardLookupResult } from "@scryhub/protocol";
import { loadLibraries } from "./stores";

import { lookupCardFromLibraryAndStore } from "./messaging/internal";
import { getCardDescriptor } from "./scryfall/data-gathering";
import { ensureHubSection, makeStoreLi, onCardPage, populateButtonNotFound, populateButtonSuccess } from "./scryfall/page-decoration";






function scheduleIdle(fn: () => void) {
  // be gentle: wait for paint, then idle
  if (document.readyState === "complete") {
    if ("requestIdleCallback" in window) (window as any).requestIdleCallback(() => fn(), { timeout: 2000 });
    else setTimeout(fn, 600);
  } else {
    window.addEventListener("load", () => scheduleIdle(fn), { once: true });
  }
}

async function renderProvidersForCard(listEl: HTMLUListElement, descriptor: CardLookupDescriptor) {
  // nothing to do if we have no providers
  const libraries = await loadLibraries();
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


      // Ask the ScryHub background worker to get info from the library
      // We don't expect many libraries and stores selected so we can wait for each
      // If this is a problem we can make promises and fire them all off later
      const extensionCallResult = await lookupCardFromLibraryAndStore(
        library.id, store.key, descriptor
      );

      if (!extensionCallResult.ok) {
        populateButtonNotFound(priceEl);
      }
      else {
        const extensionResponse = extensionCallResult.data;

        if (!extensionResponse.ok) {
          populateButtonNotFound(priceEl);
        }
        else {
          // extension suceeded so we must have a result (could be not found that's valid)
          const succedLookup = extensionResponse.result as CardLookupResult;

          if (!succedLookup.found) {
            populateButtonNotFound(priceEl);
          }
          else {
            const cardAnswer = succedLookup.card;
            populateButtonSuccess(a, priceEl, cardAnswer);
          }
        }
      }
    }
  }
}


// using an IIFE to run async code
(function boot() {
  // skip non single card pagess
  if (!onCardPage()) {
    return;
  }

  // ensure the div we mount things to is there
  const sec = ensureHubSection();
  if (!sec) {
    return;
  }

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
