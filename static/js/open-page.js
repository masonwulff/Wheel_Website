document.addEventListener("DOMContentLoaded", () => {
  const raw = JSON.parse(document.getElementById("caseItems").textContent);

  // The server already computed weight/color/tier for this case
  // (tiers.py); this just maps its field names to what Reel expects.
  const items = raw.map((it) => ({
    label: it.name,
    weight: it.weight,
    color: it.color,
    tierName: it.tier,
  }));

  const caseTile = document.getElementById("caseTile");
  const caseHint = document.getElementById("caseHint");
  const viewport = document.getElementById("caseViewport");
  const track = document.getElementById("reelTrack");
  const resultEl = document.getElementById("result");

  Reel.renderIdleReel(track, items);

  caseTile.addEventListener("click", () => {
    Reel.openCase(items, { track, viewport, caseTile, caseHint, resultEl });
  });
});