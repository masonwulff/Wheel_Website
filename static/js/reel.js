const Reel = (() => {
  const ITEM_W = 140;
  const LANDING_INDEX = 55;
  const ITEMS_AFTER_LANDING = 8;

  function weightedRandomItem(items) {
    const total = items.reduce((sum, it) => sum + it.weight, 0);
    let r = Math.random() * total;
    for (const it of items) {
      r -= it.weight;
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }

  function makeCard(item) {
    const el = document.createElement("div");
    el.className = "item-card";
    el.style.setProperty("--tier-color", item.color);
    el.textContent = item.label;
    return el;
  }

  // A calm, non-spinning fill so the reel isn't empty before opening.
  function renderIdleReel(track, items) {
    track.innerHTML = "";
    track.style.transition = "none";
    track.style.transform = "translateY(-50%) translateX(0px)";
    for (let i = 0; i < 12; i++) {
      track.appendChild(makeCard(weightedRandomItem(items)));
    }
  }

  function buildReelForWinner(track, items, winnerLabel) {
    track.innerHTML = "";
    const winnerItem = items.find((it) => it.label === winnerLabel) || items[0];

    const totalCards = LANDING_INDEX + 1 + ITEMS_AFTER_LANDING;
    let landingCardEl = null;

    for (let i = 0; i < totalCards; i++) {
      const item = i === LANDING_INDEX ? winnerItem : weightedRandomItem(items);
      const card = makeCard(item);
      track.appendChild(card);
      if (i === LANDING_INDEX) landingCardEl = card;
    }

    return landingCardEl;
  }

  // items: [{label, weight, color}]
  // els: { track, viewport, caseTile, caseHint, resultEl }
  async function openCase(items, els) {
    const { track, viewport, caseTile, caseHint, resultEl } = els;

    if (items.length < 2) {
      resultEl.textContent = "This case needs at least two items.";
      return;
    }

    caseTile.disabled = true;
    caseHint.textContent = "Opening...";
    resultEl.textContent = "";

    const choices = items.map((it) => it.label);
    const weights = items.map((it) => it.weight);

    let winnerLabel;
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices, weights }),
      });
      const data = await res.json();
      winnerLabel = data.choice;
    } catch (err) {
      resultEl.textContent = "Something went wrong reaching the server.";
      caseTile.disabled = false;
      caseHint.textContent = "Click to open";
      return;
    }

    // Reset instantly before laying out the fresh reel, so every open
    // starts from the same clean position.
    track.style.transition = "none";
    track.style.transform = "translateY(-50%) translateX(0px)";

    const landingCard = buildReelForWinner(track, items, winnerLabel);

    // Force layout so the browser commits the reset above before we
    // measure positions and start the real animation.
    // eslint-disable-next-line no-unused-expressions
    track.offsetHeight;

    const viewportRect = viewport.getBoundingClientRect();
    const cardRect = landingCard.getBoundingClientRect();

    // Land somewhere within the middle 60% of the card, not dead
    // center every time -- same realism touch real case sites use.
    const jitter = (Math.random() - 0.5) * (ITEM_W * 0.6);

    const cardCenter = cardRect.left + cardRect.width / 2;
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    const delta = cardCenter - viewportCenter + jitter;

    track.style.transition = "transform 5.5s cubic-bezier(0.12, 0.68, 0.1, 1)";
    track.style.transform = `translateY(-50%) translateX(${-delta}px)`;

    track.addEventListener(
      "transitionend",
      () => {
        landingCard.classList.add("winner");
        resultEl.textContent = `Unboxed: ${winnerLabel}`;
        caseTile.disabled = false;
        caseHint.textContent = "Click to open again";
      },
      { once: true }
    );
  }

  return { renderIdleReel, buildReelForWinner, openCase, weightedRandomItem, makeCard };
})();

window.Reel = Reel;