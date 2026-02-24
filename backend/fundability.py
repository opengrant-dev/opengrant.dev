"""
Fundability Analyzer
=====================
Analyzes a GitHub repo's metadata and scores it across 5 dimensions:
  Documentation (25pts) | Licensing (20pts) | Community (25pts) | Activity (20pts) | Visibility (10pts)

Returns actionable tips to increase fundability score.
No API call needed — pure rule-based analysis for instant results.
"""


IMPACT_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}

OSS_LICENSES = {
    "MIT", "Apache-2.0", "GPL-3.0", "GPL-2.0", "BSD-3-Clause",
    "BSD-2-Clause", "LGPL-2.1", "LGPL-3.0", "MPL-2.0", "AGPL-3.0",
    "CC0-1.0", "ISC", "Unlicense", "EUPL-1.2",
}


def _tip(area: str, impact: str, text: str) -> dict:
    return {"area": area, "impact": impact, "tip": text}


def analyze_fundability(repo: dict) -> dict:
    """
    Analyze a repo dict and return a fundability report.
    """
    tips = []
    categories = {}

    # ── Documentation (25 pts) ─────────────────────────────────────────────
    doc_score = 0

    if repo.get("description") and len(repo["description"].strip()) > 20:
        doc_score += 5
    else:
        tips.append(_tip(
            "Documentation", "high",
            "Add a clear, specific description to your GitHub repo (Settings → About). "
            "Grant reviewers read this first — make it count."
        ))

    readme = repo.get("readme_excerpt") or ""
    if len(readme) >= 1000:
        doc_score += 12
    elif len(readme) >= 300:
        doc_score += 7
        tips.append(_tip(
            "Documentation", "high",
            f"Your README is short ({len(readme)} chars). Expand it with: installation guide, "
            "usage examples, screenshots, and a clear mission statement. Good READMEs double grant success rates."
        ))
    else:
        tips.append(_tip(
            "Documentation", "critical",
            "Your README is almost empty. This is the #1 reason projects get rejected. Add: "
            "what the project does, why it exists, how to install/use it, and how to contribute."
        ))

    if repo.get("homepage"):
        doc_score += 5
    else:
        tips.append(_tip(
            "Documentation", "medium",
            "Add a homepage/docs URL to your GitHub repo. Projects with documentation sites "
            "score ~30% higher in grant reviews."
        ))

    topics = repo.get("topics") or []
    if len(topics) >= 5:
        doc_score += 3
    elif len(topics) >= 2:
        doc_score += 1
        tips.append(_tip(
            "Discoverability", "medium",
            f"Add more GitHub topics (currently {len(topics)}). Aim for 5-10 relevant topics — "
            "these help fund matching algorithms and grant reviewers find your project."
        ))
    else:
        tips.append(_tip(
            "Discoverability", "high",
            f"You have {len(topics)} GitHub topics. Add at least 5 relevant topics (language, domain, use case). "
            "Go to GitHub repo → Settings → Topics."
        ))

    categories["Documentation"] = min(doc_score, 25)

    # ── Licensing (20 pts) ────────────────────────────────────────────────
    license_name = repo.get("license_name") or ""
    license_score = 0

    if license_name and license_name not in ("NOASSERTION", "Other", ""):
        if license_name in OSS_LICENSES:
            license_score = 20
        else:
            license_score = 12
            tips.append(_tip(
                "Licensing", "medium",
                f"Your license ({license_name}) is recognized but less common. Consider MIT or Apache-2.0 "
                "for broadest grant eligibility — many funds explicitly require these licenses."
            ))
    else:
        tips.append(_tip(
            "Licensing", "critical",
            "NO LICENSE DETECTED. This disqualifies you from most grants immediately. "
            "Add an MIT or Apache-2.0 license today: GitHub repo → Add file → LICENSE."
        ))

    categories["Licensing"] = license_score

    # ── Community (25 pts) ────────────────────────────────────────────────
    community_score = 0
    stars = repo.get("stars", 0)
    contributors = repo.get("contributors_count", 0)
    forks = repo.get("forks", 0)

    # Stars
    if stars >= 500:
        community_score += 10
    elif stars >= 100:
        community_score += 7
    elif stars >= 25:
        community_score += 4
    elif stars >= 5:
        community_score += 2
    else:
        tips.append(_tip(
            "Community", "high",
            f"Only {stars} stars. Share your project on: Hacker News (Show HN), Reddit r/programming, "
            "Dev.to, Twitter/X, and relevant Discord communities. Aim for 50+ stars before applying to grants."
        ))

    # Contributors
    if contributors >= 10:
        community_score += 10
    elif contributors >= 3:
        community_score += 6
    elif contributors >= 2:
        community_score += 3
    else:
        tips.append(_tip(
            "Community", "high",
            f"Only {contributors} contributor(s). Add a CONTRIBUTING.md file, label easy issues "
            "as 'good first issue', and engage with PRs quickly. Multi-contributor projects are "
            "4x more likely to receive grants."
        ))

    # Forks
    if forks >= 50:
        community_score += 5
    elif forks >= 10:
        community_score += 3
    elif forks >= 3:
        community_score += 1
    else:
        tips.append(_tip(
            "Community", "low",
            f"Only {forks} forks. Forks signal real-world usage and community adoption — "
            "promote your project and make it easy to build on."
        ))

    categories["Community"] = min(community_score, 25)

    # ── Activity (20 pts) ─────────────────────────────────────────────────
    activity_score = 0
    commit_freq = repo.get("commit_frequency", 0.0)
    open_issues = repo.get("open_issues", 0)
    is_fork = repo.get("is_fork", False)

    if is_fork:
        tips.append(_tip(
            "Activity", "high",
            "This repo is a fork. Most grants require original projects. Consider moving "
            "your unique contributions to a new original repo."
        ))

    if commit_freq >= 10:
        activity_score += 15
    elif commit_freq >= 3:
        activity_score += 10
    elif commit_freq >= 1:
        activity_score += 6
    elif commit_freq >= 0.25:
        activity_score += 3
    else:
        tips.append(_tip(
            "Activity", "critical",
            f"Very low commit frequency ({commit_freq:.1f}/week). Grant reviewers check activity graphs — "
            "an inactive project signals low maintainability. Aim for at least 2-3 commits/week."
        ))

    if open_issues >= 5:
        activity_score += 5
    elif open_issues >= 1:
        activity_score += 3
    else:
        tips.append(_tip(
            "Activity", "low",
            "No open issues. Open issues show active development. Create GitHub issues for "
            "planned features, bugs, and improvements — this shows an active, organized project."
        ))

    categories["Activity"] = min(activity_score, 20)

    # ── Visibility (10 pts) ───────────────────────────────────────────────
    visibility_score = 0

    if not is_fork:
        visibility_score += 4

    if repo.get("has_pages"):
        visibility_score += 4
    else:
        tips.append(_tip(
            "Visibility", "medium",
            "Enable GitHub Pages for a free documentation/project site. "
            "Projects with websites are perceived as more serious and professional."
        ))

    if repo.get("has_wiki"):
        visibility_score += 2

    categories["Visibility"] = min(visibility_score, 10)

    # ── Totals ────────────────────────────────────────────────────────────
    total = sum(categories.values())

    if total >= 85:
        grade = "A+"
        verdict = "Exceptional fundability. Apply to top-tier grants immediately."
    elif total >= 75:
        grade = "A"
        verdict = "Strong fundability. You're competitive for most grants."
    elif total >= 60:
        grade = "B"
        verdict = "Good fundability. Address the critical/high tips before applying."
    elif total >= 45:
        grade = "C"
        verdict = "Moderate fundability. Focus on critical issues first — you're close."
    elif total >= 30:
        grade = "D"
        verdict = "Low fundability. Fix licensing and documentation issues before applying."
    else:
        grade = "F"
        verdict = "Not yet ready for funding. Start with the critical tips below."

    tips.sort(key=lambda x: IMPACT_ORDER.get(x["impact"], 99))

    return {
        "total_score": total,
        "max_score": 100,
        "grade": grade,
        "verdict": verdict,
        "categories": {
            "Documentation": {"score": categories["Documentation"], "max": 25},
            "Licensing":      {"score": categories["Licensing"],      "max": 20},
            "Community":      {"score": categories["Community"],      "max": 25},
            "Activity":       {"score": categories["Activity"],       "max": 20},
            "Visibility":     {"score": categories["Visibility"],     "max": 10},
        },
        "tips": tips,
        "tip_counts": {
            "critical": sum(1 for t in tips if t["impact"] == "critical"),
            "high":     sum(1 for t in tips if t["impact"] == "high"),
            "medium":   sum(1 for t in tips if t["impact"] == "medium"),
            "low":      sum(1 for t in tips if t["impact"] == "low"),
        },
    }
