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

    const bucket = window.CS_TIERS.findIndex((t) => t.color === item.color);
    if (bucket > rarestBucket) {
      rarestBucket = bucket;
      rarestColor = item.color;
    }
  });

  caseTile.style.setProperty("--tier-accent", rarestColor);
}

function rebuildCase() {
  const { choices, weights } = parseInputs();
  items = window.assignTiers(choices, weights);
  resultEl.textContent = "";
  updateWeightTotal(weights, weightsInput.value.trim().length > 0);
  updateCaseTile();
  Reel.renderIdleReel(track, items);
}

updateBtn.addEventListener("click", rebuildCase);
caseNameInput.addEventListener("input", () => {
  caseNameLabel.textContent = caseNameInput.value.trim() || "My Case";
});
caseTile.addEventListener("click", () => {
  Reel.openCase(items, { track, viewport, caseTile, caseHint, resultEl });
});

rebuildCase();