// CS2's real rarity ladder, rarest to most common. Mirrors tiers.py --
// the custom builder needs this client-side for instant live preview
// as you type; premade cases compute the same thing server-side once
// and never need to redo it in the browser.
const CS_TIERS = [
  { name: "Covert", color: "#EB4B4B" },
  { name: "Classified", color: "#D32CE6" },
  { name: "Restricted", color: "#8847FF" },
  { name: "Mil-Spec", color: "#4B69FF" },
  { name: "Industrial", color: "#5E98D9" },
  { name: "Consumer", color: "#B0C3D9" },
];

function assignTiers(choices, weights) {
  const uniqueSorted = [...new Set(weights)].sort((a, b) => a - b);

  if (uniqueSorted.length <= 1) {
    const neutral = CS_TIERS[3];
    return choices.map((label, i) => ({
      label,
      weight: weights[i],
      color: neutral.color,
      tierName: neutral.name,
    }));
  }

  return choices.map((label, i) => {
    const w = weights[i];
    const pos = uniqueSorted.indexOf(w);
    const bucket = Math.min(
      CS_TIERS.length - 1,
      Math.floor((pos / uniqueSorted.length) * CS_TIERS.length)
    );
    const tier = CS_TIERS[bucket];
    return { label, weight: w, color: tier.color, tierName: tier.name };
  });
}

window.CS_TIERS = CS_TIERS;
window.assignTiers = assignTiers;