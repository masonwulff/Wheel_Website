# CS2's real rarity ladder, rarest to most common.
TIERS = [
    {"name": "Covert", "color": "#EB4B4B"},
    {"name": "Classified", "color": "#D32CE6"},
    {"name": "Restricted", "color": "#8847FF"},
    {"name": "Mil-Spec", "color": "#4B69FF"},
    {"name": "Industrial", "color": "#5E98D9"},
    {"name": "Consumer", "color": "#B0C3D9"},
]


def assign_tiers(items):
    """Given [{"name": ..., "weight": ...}, ...], return the same items
    with a "color" and "tier" attached, based on how each item's weight
    RANKS against the others -- not the raw number. That way two items
    with drop chances of 40/1 and 4000/100 get the same visual spread,
    and items that all share one weight get one neutral tier instead of
    a misleading rarity gradient.

    This is the single source of truth for tier colors on premade
    cases: the cases/items/open pages all render whatever this
    computes, so a case looks the same wherever you see it.
    """
    unique_weights = sorted({item["weight"] for item in items})

    if len(unique_weights) <= 1:
        neutral = TIERS[3]  # Mil-Spec: nothing to signal, so stay neutral
        return [
            {**item, "color": neutral["color"], "tier": neutral["name"]}
            for item in items
        ]

    n = len(unique_weights)
    result = []
    for item in items:
        pos = unique_weights.index(item["weight"])  # 0 = the rarest weight value
        bucket = min(len(TIERS) - 1, int((pos / n) * len(TIERS)))
        tier = TIERS[bucket]
        result.append({**item, "color": tier["color"], "tier": tier["name"]})
    return result