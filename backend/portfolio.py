"""
Grant Stack Portfolio Optimizer
=================================
Given a repo's existing match scores, finds the optimal set of grants to
apply for — maximizing total potential funding while avoiding conflicts.

Conflict groups: funders within the same group cannot both be awarded
(same government body, same program budget pool, etc.)
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Conflict groups: funders in the same group compete for the same budget pool
# ---------------------------------------------------------------------------
CONFLICT_GROUPS = [
    {
        "group": "EU Public Infrastructure",
        "reason": "Same European Commission budget pools; mutual exclusivity often required",
        "members": [
            "NLnet Foundation",
            "Prototype Fund Germany",
            "Sovereign Tech Fund",
            "EU Horizon / NGI",
            "NGI Assure",
            "NGI Zero",
            "NGI Pointer",
            "NGI Explorers",
        ],
    },
    {
        "group": "India Government Programs",
        "reason": "Overlapping Indian government startup/tech initiatives",
        "members": [
            "Startup India",
            "MeitY Startup Hub",
            "iDEX",
            "NASSCOM Foundation",
            "Digital India",
            "BIRAC",
        ],
    },
    {
        "group": "US Federal Research",
        "reason": "NSF/DARPA are both US federal; simultaneous awards require explicit approval",
        "members": [
            "NSF POSE",
            "NSF SBIR/STTR",
            "DARPA / DoD",
            "NIH",
            "DOE Office of Science",
        ],
    },
    {
        "group": "Mozilla Programs",
        "reason": "Mozilla Foundation runs one active grant per project at a time",
        "members": [
            "Mozilla MOSS",
            "Mozilla Technology Fund",
            "Mozilla Foundation Grants",
        ],
    },
    {
        "group": "Ethereum Ecosystem",
        "reason": "Ethereum Foundation & adjacent grants share reviewers; parallel applications signal",
        "members": [
            "Ethereum Foundation",
            "Optimism RetroPGF",
            "Gitcoin Grants",
            "Protocol Guild",
        ],
    },
    {
        "group": "IPFS / Filecoin",
        "reason": "Same parent org (Protocol Labs); one grant per project recommended",
        "members": [
            "Filecoin Foundation",
            "Protocol Labs",
            "IPFS Fund",
        ],
    },
    {
        "group": "Linux Foundation Programs",
        "reason": "LF umbrella — applying to multiple sub-programs simultaneously is discouraged",
        "members": [
            "Linux Foundation",
            "CNCF",
            "LFX Mentorship",
            "Core Infrastructure Initiative",
            "OpenSSF",
        ],
    },
    {
        "group": "Chan Zuckerberg Science",
        "reason": "CZI runs one active project grant per lab/team at a time",
        "members": [
            "Chan Zuckerberg Initiative",
            "CZI Science",
            "CZI Imaging",
        ],
    },
    {
        "group": "Sloan Digital Infrastructure",
        "reason": "Sloan programs share a common review pool for software infrastructure",
        "members": [
            "Sloan Foundation",
            "Sloan Digital Infrastructure Program",
        ],
    },
    {
        "group": "Open Technology Fund",
        "reason": "OTF runs one lab/core per project; parallel funding raises conflict-of-interest flags",
        "members": [
            "Open Technology Fund",
            "OTF Core Infrastructure Fund",
            "OTF Labs",
        ],
    },
    {
        "group": "GitHub Sponsorship Platforms",
        "reason": "Can use only one primary fiscal sponsor at a time",
        "members": [
            "GitHub Sponsors",
            "Open Collective",
            "Open Source Collective",
            "Tidelift",
        ],
    },
    {
        "group": "UK Research Councils",
        "reason": "UKRI councils pool funding; duplicate applications flagged",
        "members": [
            "UK Research and Innovation",
            "UKRI",
            "EPSRC",
            "ESRC",
            "Innovate UK",
        ],
    },
]

# Build a fast lookup: funder_name → group name
_FUNDER_TO_GROUP: dict[str, str] = {}
for cg in CONFLICT_GROUPS:
    for member in cg["members"]:
        _FUNDER_TO_GROUP[member.lower()] = cg["group"]


def _get_conflict_group(funder_name: str) -> str | None:
    """Return the conflict group name for a funder, or None if no conflicts."""
    return _FUNDER_TO_GROUP.get(funder_name.lower())


# ---------------------------------------------------------------------------
# Application complexity tiers (weeks of effort to apply)
# ---------------------------------------------------------------------------
APPLICATION_EFFORT = {
    "NSF POSE": 12,
    "DARPA / DoD": 16,
    "EU Horizon / NGI": 14,
    "Chan Zuckerberg Initiative": 10,
    "Sloan Foundation": 10,
    "Linux Foundation": 8,
    "Mozilla MOSS": 6,
    "Sovereign Tech Fund": 6,
    "NLnet Foundation": 5,
    "Prototype Fund Germany": 5,
    "Open Technology Fund": 7,
    "Ethereum Foundation": 4,
    "Gitcoin Grants": 2,
    "GitHub Sponsors": 1,
    "Open Source Collective": 1,
}
DEFAULT_EFFORT_WEEKS = 4


def optimize_portfolio(matches: list[dict], max_grants: int = 6) -> dict:
    """
    Build an optimal grant application stack from a list of matches.

    Args:
        matches: List of match dicts with keys:
                   funding_id, match_score (0-100), funding_source dict
                   (funding_source should have: name, min_amount, max_amount)
        max_grants: Maximum number of grants to include (default 6)

    Returns:
        {
          "optimal_stack": [...],        # list of selected grants
          "total_potential_usd": int,
          "application_order": [...],    # names in recommended order
          "conflict_warnings": [...],
          "excluded": [...],             # grants excluded due to conflicts
          "strategy_notes": [...],
        }
    """
    if not matches:
        return {
            "optimal_stack": [],
            "total_potential_usd": 0,
            "application_order": [],
            "conflict_warnings": [],
            "excluded": [],
            "strategy_notes": ["No matches found. Run AI matching first."],
        }

    # Enrich each match with value score
    enriched = []
    for m in matches:
        fs = m.get("funding_source") or {}
        name = fs.get("name", "Unknown")
        score = float(m.get("match_score", 0))
        max_amt = int(fs.get("max_amount") or 0)
        min_amt = int(fs.get("min_amount") or 0)
        mid_amt = (max_amt + min_amt) // 2 if max_amt else min_amt

        # Value = match_score * midpoint_amount (normalized)
        # Use log of amount to prevent mega-grants dominating entirely
        import math
        amt_factor = math.log1p(mid_amt) if mid_amt > 0 else 1.0
        value = (score / 100.0) * amt_factor

        effort = APPLICATION_EFFORT.get(name, DEFAULT_EFFORT_WEEKS)
        conflict_group = _get_conflict_group(name)

        enriched.append({
            "funding_id": m.get("funding_id"),
            "name": name,
            "score": score,
            "min_amount": min_amt,
            "max_amount": max_amt,
            "mid_amount": mid_amt,
            "value": value,
            "effort_weeks": effort,
            "value_per_effort": value / max(effort, 1),
            "conflict_group": conflict_group,
            "match_score": score,
            "funding_source": fs,
            "reasoning": m.get("reasoning", ""),
            "strengths": m.get("strengths", []),
            "gaps": m.get("gaps", []),
        })

    # Sort by value_per_effort descending (best ROI first)
    enriched.sort(key=lambda x: x["value_per_effort"], reverse=True)

    # Greedy selection: pick highest-value, skip conflicts
    selected = []
    excluded = []
    used_conflict_groups: set[str] = set()
    conflict_warnings = []

    for item in enriched:
        if len(selected) >= max_grants:
            break

        cg = item["conflict_group"]
        if cg and cg in used_conflict_groups:
            # Find which selected item caused the conflict
            blocker = next((s for s in selected if s["conflict_group"] == cg), None)
            blocker_name = blocker["name"] if blocker else "another grant"
            conflict_warnings.append(
                f"'{item['name']}' excluded: conflicts with '{blocker_name}' "
                f"(both in '{cg}' group)"
            )
            excluded.append({**item, "excluded_reason": f"Conflict with {blocker_name} ({cg})"})
            continue

        selected.append(item)
        if cg:
            used_conflict_groups.add(cg)

    # Application order: quick wins first, then big grants
    def order_key(g):
        # Quick wins = low effort, high score
        # Big grants = high amount
        quick_win_score = g["score"] / max(g["effort_weeks"], 1)
        return (-quick_win_score, -g["max_amount"])

    application_order_items = sorted(selected, key=order_key)
    application_order = [g["name"] for g in application_order_items]

    total_potential = sum(g["max_amount"] for g in selected)

    # Strategy notes
    strategy_notes = []
    quick_wins = [g for g in selected if g["effort_weeks"] <= 3 and g["score"] >= 60]
    if quick_wins:
        strategy_notes.append(
            f"Start with {len(quick_wins)} quick-win application(s) "
            f"({', '.join(g['name'] for g in quick_wins[:2])}) — "
            f"low effort, good match scores."
        )

    big_grants = [g for g in selected if g["max_amount"] >= 50000]
    if big_grants:
        strategy_notes.append(
            f"Reserve 2-3 months for {len(big_grants)} high-value application(s) "
            f"({', '.join(g['name'] for g in big_grants[:2])})."
        )

    if conflict_warnings:
        strategy_notes.append(
            f"{len(conflict_warnings)} grant(s) excluded due to funder conflicts — "
            f"consider applying after receiving (or being rejected by) the conflicting grant."
        )

    total_effort = sum(g["effort_weeks"] for g in selected)
    strategy_notes.append(
        f"Estimated total application effort: ~{total_effort} weeks across {len(selected)} grant(s)."
    )

    return {
        "optimal_stack": selected,
        "total_potential_usd": total_potential,
        "application_order": application_order,
        "conflict_warnings": conflict_warnings,
        "excluded": excluded[:5],  # top 5 excluded for display
        "strategy_notes": strategy_notes,
        "total_grants_considered": len(matches),
        "grants_selected": len(selected),
    }
