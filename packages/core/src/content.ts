/**
 * Enriches the scryfall page with the buy this card placeholder for multiple providers
 */

import { CardLookupDescriptor, CardLookupResult } from "@scryhub/protocol";

import { lookupCardFromLibraryAndStore } from "./messaging/internal";
import { getCardDescriptor } from "./scryfall/data-gathering";
import { appendStoreButton, ensureHubSection, makeStoreLi, onCardPage, populateButtonNotFound, populateButtonSuccess } from "./scryfall/page-decoration";
import { isLibraryComptible, updateCompatibilitiesIfNeeded } from "./settings/storage";
import { createLogger } from "./logger/factory";


const contentLogger = createLogger("[ScryHub.Content]");

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
  // update compatibility for all libraries
  const libraries = await updateCompatibilitiesIfNeeded();

  // nothing to do if we have no providers
  if (!libraries.length) {
    return;
  }

  // Create one LI per enabled store (per LGSLibrary)
  for (const library of libraries) {
    if (!isLibraryComptible(library)) {
      contentLogger.log('skipping incompatible library', library.id);
      continue;
    }

    const enabledStores = (library.stores || []).filter(s => s.enabled);
    for (const store of enabledStores) {
      const label = store.name || `${library.name || library.id} — ${store.key}`;

      // the list item will come with at least 1 button
      const { li, a, priceEl, metaEl } = makeStoreLi(label);
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
            const byFinish = new Map(succedLookup.cards.map(c => [c.finishTreatment, c]));

            for (const finish of ["nonfoil", "foil"] as const) {
              const info = byFinish.get(finish);
              if (!info) continue;

              const target = finish === "nonfoil"
                ? { a, priceEl, metaEl }                // from makeStoreLi
                : appendStoreButton(li, label);     // add new button

              // fill in the details with the same style
              populateButtonSuccess(target.a, target.priceEl, info);
              // add a little spacing
              target.metaEl.textContent = finish === "foil" ? "(Foil)" : "";
            }
          }
        }
      }
    }
  }
}


// using an IIFE to run async code
(async function boot() {
  // skip non single card pagess
  if (!onCardPage()) {
    return;
  }

  // ensure the div we mount things to is there
  const sec = await ensureHubSection();
  if (!sec) {
    return;
  }

  // build store sections per card
  scheduleIdle(async () => {
    const sec2 = await ensureHubSection();
    if (!sec2) {
      return;
    }

    const cardDescriptor = getCardDescriptor();
    renderProvidersForCard(sec.list, cardDescriptor);
  });

  // Re-run on PJAX
  const _ps = history.pushState; const _rs = history.replaceState;
  const rerun = async () => { if (onCardPage()) await ensureHubSection(); };
  history.pushState = function (...a) { _ps.apply(this, a as any); rerun(); };
  history.replaceState = function (...a) { _rs.apply(this, a as any); rerun(); };
  window.addEventListener("popstate", rerun);
})();
