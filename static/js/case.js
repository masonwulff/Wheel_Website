const caseTile = document.getElementById("caseTile");
const caseNameLabel = document.getElementById("caseNameLabel");
const rarityBar = document.getElementById("rarityBar");
const caseHint = document.getElementById("caseHint");
const viewport = document.getElementById("caseViewport");
const track = document.getElementById("reelTrack");
const resultEl = document.getElementById("result");

const caseNameInput = document.getElementById("caseNameInput");
const choicesInput = document.getElementById("choicesInput");
const weightsInput = document.getElementById("weightsInput");
const weightTotalEl = document.getElementById("weightTotal");
const updateBtn = document.getElementById("updateBtn");

// CS2's real rarity ladder, rarest to most common.
const TIERS = [
  { name: "Covert", color: "#EB4B4B" },
  { name: "Classified", color: "#D32CE6" },
  { name: "Restricted", color: "#8847FF" },
  { name: "Mil-Spec", color: "#4B69FF" },
  { name: "Industrial", color: "#5E98D9" },
  { name: "Consumer", color: "#B0C3D9" },
];

const ITEM_W = 140;
const LANDING_INDEX = 55;
const ITEMS_AFTER_LANDING = 8;

let items = []; // [{label, weight, color, tierName}] -- weight is a % of 100

function parsePercentWeights(rawList, count) {
  const parsed = rawList.split(",").map((w) => parseFloat(w.trim()));
  const valid = parsed.length === count && parsed.every((w) => !isNaN(w) && w > 0);
  if (valid) return parsed;
  return Array(count).fill(+(100 / count).toFixed(2));
}

function parseInputs() {
  const choices = choicesInput.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const weights = parsePercentWeights(weightsInput.value.trim(), choices.length);
  return { choices, weights };
}

// Colors are cosmetic only -- they never touch who actually wins.
// An item's tier is based on how its % ranks against the others, so
// equal percentages always get the same (neutral) tier instead of a
// misleading spread of rarities.
function assignTiers(choices, weights) {
  const uniqueSorted = [...new Set(weights)].sort((a, b) => a - b);

  if (uniqueSorted.length <= 1) {
    const neutral = TIERS[3]; // Mil-Spec: no real variation to signal
    return choices.map((label, i) => ({
      label,
      weight: weights[i],
      color: neutral.color,
      tierName: neutral.name,
    }));
  }

  return choices.map((label, i) => {
    const w = weights[i];
    const pos = uniqueSorted.indexOf(w); // 0 = the rarest % value
    const bucket = Math.min(
      TIERS.length - 1,
      Math.floor((pos / uniqueSorted.length) * TIERS.length)
    );
    const tier = TIERS[bucket];
    return { label, weight: w, color: tier.color, tierName: tier.name };
  });
}

function weightedRandomItem() {
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

function updateWeightTotal(weights, wasTyped) {
  if (!wasTyped) {
    weightTotalEl.textContent = "Equal odds for all items (100% split evenly).";
    weightTotalEl.className = "weight-total";
    return;
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const rounded = Math.round(sum * 100) / 100;
  weightTotalEl.textContent = `Total: ${rounded}%`;
  weightTotalEl.className =
    "weight-total " + (Math.abs(sum - 100) < 0.5 ? "is-good" : "is-off");
}

function updateCaseTile() {
  caseNameLabel.textContent = caseNameInput.value.trim() || "My Case";

  rarityBar.innerHTML = "";
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  let rarestColor = items[0] ? items[0].color : "#F2B705";
  let rarestBucket = -1;

  items.forEach((item) => {
    const seg = document.createElement("span");
    seg.style.width = `${(item.weight / totalWeight) * 100}%`;
    seg.style.backgroundColor = item.color;
    rarityBar.appendChild(seg);

    const bucket = TIERS.findIndex((t) => t.color === item.color);
    if (bucket > rarestBucket) {
      rarestBucket = bucket;
      rarestColor = item.color;
    }
  });

  caseTile.style.setProperty("--tier-accent", rarestColor);
}

function rebuildCase() {
  const { choices, weights } = parseInputs();
  items = assignTiers(choices, weights);
  resultEl.textContent = "";
  updateWeightTotal(weights, weightsInput.value.trim().length > 0);
  updateCaseTile();
  renderIdleReel();
}

// A calm, non-spinning fill so the reel isn't empty before opening.
function renderIdleReel() {
  track.innerHTML = "";
  track.style.transition = "none";
  track.style.transform = "translateY(-50%) translateX(0px)";
  for (let i = 0; i < 12; i++) {
    track.appendChild(makeCard(weightedRandomItem()));
  }
}

function buildReelForWinner(winnerLabel) {
  track.innerHTML = "";
  const winnerItem = items.find((it) => it.label === winnerLabel) || items[0];

  const totalCards = LANDING_INDEX + 1 + ITEMS_AFTER_LANDING;
  let landingCardEl = null;

  for (let i = 0; i < totalCards; i++) {
    const item = i === LANDING_INDEX ? winnerItem : weightedRandomItem();
    const card = makeCard(item);
    track.appendChild(card);
    if (i === LANDING_INDEX) landingCardEl = card;
  }

  return landingCardEl;
}

async function openCase() {
  if (items.length < 2) {
    resultEl.textContent = "Add at least two items first.";
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

  // Reset the track instantly (no transition) before laying out the
  // fresh reel, so every open starts from the same clean position.
  track.style.transition = "none";
  track.style.transform = "translateY(-50%) translateX(0px)";

  const landingCard = buildReelForWinner(winnerLabel);

  // Force layout so the browser commits the reset above before we
  // measure positions and start the real animation.
  // eslint-disable-next-line no-unused-expressions
  track.offsetHeight;

  const viewportRect = viewport.getBoundingClientRect();
  const cardRect = landingCard.getBoundingClientRect();

  // Land somewhere within the middle 60% of the card, not dead center
  // every time -- small realism touch, same as real case sites.
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

updateBtn.addEventListener("click", rebuildCase);
caseNameInput.addEventListener("input", () => {
  caseNameLabel.textContent = caseNameInput.value.trim() || "My Case";
});
caseTile.addEventListener("click", openCase);

rebuildCase();