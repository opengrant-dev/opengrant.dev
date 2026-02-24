"""
Funding Velocity Calculator
=============================
Calculates how fast a repo is gaining the signals funders care about,
benchmarks against historical funded-project averages, and predicts
how many weeks until key funding milestones are reachable.
"""

from __future__ import annotations
import math
from datetime import datetime, timezone
from funded_dna import FUNDED_PROJECT_AVERAGES, CATEGORY_STAR_THRESHOLDS


# ---------------------------------------------------------------------------
# Funding threshold requirements per grant type
# ---------------------------------------------------------------------------
GRANT_THRESHOLDS = {
    "GitHub Sponsors": {
        "min_stars": 0, "min_contributors": 1, "min_commits_pw": 0.1,
        "needs_license": True, "needs_readme": True, "needs_ci": False,
        "description": "Any active OSS project",
    },
    "Open Source Collective": {
        "min_stars": 50, "min_contributors": 2, "min_commits_pw": 0.5,
        "needs_license": True, "needs_readme": True, "needs_ci": False,
        "description": "Small community-driven project",
    },
    "Gitcoin Grants": {
        "min_stars": 50, "min_contributors": 2, "min_commits_pw": 0.5,
        "needs_license": True, "needs_readme": True, "needs_ci": False,
        "description": "Web3-adjacent open source",
    },
    "Prototype Fund Germany": {
        "min_stars": 100, "min_contributors": 1, "min_commits_pw": 1.0,
        "needs_license": True, "needs_readme": True, "needs_ci": False,
        "description": "Civic-tech or public-interest software",
    },
    "NLnet Foundation": {
        "min_stars": 100, "min_contributors": 1, "min_commits_pw": 1.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Internet infrastructure or privacy tooling",
    },
    "Mozilla MOSS": {
        "min_stars": 500, "min_contributors": 3, "min_commits_pw": 2.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Open web or security tooling",
    },
    "Sovereign Tech Fund": {
        "min_stars": 500, "min_contributors": 3, "min_commits_pw": 2.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Critical digital infrastructure",
    },
    "Ethereum Foundation": {
        "min_stars": 200, "min_contributors": 2, "min_commits_pw": 1.5,
        "needs_license": True, "needs_readme": True, "needs_ci": False,
        "description": "Ethereum ecosystem tooling",
    },
    "NSF POSE": {
        "min_stars": 1000, "min_contributors": 5, "min_commits_pw": 4.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Scientific software with active community",
    },
    "Linux Foundation": {
        "min_stars": 1000, "min_contributors": 10, "min_commits_pw": 5.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Production-grade infrastructure software",
    },
    "Sloan Foundation": {
        "min_stars": 1000, "min_contributors": 5, "min_commits_pw": 3.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Scientific computing or data infrastructure",
    },
    "Chan Zuckerberg Initiative": {
        "min_stars": 1000, "min_contributors": 5, "min_commits_pw": 3.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Biomedical or scientific open source",
    },
    "DARPA / DoD": {
        "min_stars": 500, "min_contributors": 3, "min_commits_pw": 3.0,
        "needs_license": True, "needs_readme": True, "needs_ci": True,
        "description": "Dual-use technology with national security applications",
    },
}


def _weeks_since(dt_value) -> float:
    """Return weeks elapsed since a datetime (or ISO string)."""
    if dt_value is None:
        return 52.0  # assume 1 year if unknown

    if isinstance(dt_value, str):
        try:
            dt_value = datetime.fromisoformat(dt_value.replace("Z", "+00:00"))
        except Exception:
            return 52.0

    if dt_value.tzinfo is None:
        dt_value = dt_value.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    delta = now - dt_value
    return max(0.0, delta.total_seconds() / 604800)  # 604800 = seconds per week


def _growth_rate(current_value: float, age_weeks: float) -> float:
    """Average units per week."""
    if age_weeks <= 0:
        return current_value
    return current_value / age_weeks


def calculate_velocity(repo: dict) -> dict:
    """
    Calculate velocity metrics and funding readiness predictions.

    Args:
        repo: Repo dict with GitHub data fields

    Returns:
        {
            "velocity_score": 0-100,
            "metrics": {...},
            "benchmarks": {...},
            "predictions": [...],
            "quick_wins": [...],
            "improvement_tips": [...],
        }
    """
    stars = int(repo.get("stars") or 0)
    forks = int(repo.get("forks") or 0)
    contributors = int(repo.get("contributors_count") or 0)
    commits_pw = float(repo.get("commit_frequency") or 0)
    has_license = bool(repo.get("license_name"))
    has_readme = bool(repo.get("readme_excerpt"))
    has_homepage = bool(repo.get("homepage"))
    created_at = repo.get("created_at_github") or repo.get("created_at")
    open_issues = int(repo.get("open_issues") or 0)
    is_fork = bool(repo.get("is_fork", False))

    age_weeks = _weeks_since(created_at)

    # ── Growth rates ──────────────────────────────────────────────────────
    stars_per_week = _growth_rate(stars, age_weeks)
    forks_per_week = _growth_rate(forks, age_weeks)

    # ── Benchmarks vs funded project averages ─────────────────────────────
    avg = FUNDED_PROJECT_AVERAGES
    bench_stars = round((stars / max(avg["stars_at_funding"], 1)) * 100, 1)
    bench_forks = round((forks / max(avg["forks_at_funding"], 1)) * 100, 1)
    bench_contributors = round((contributors / max(avg["contributors_at_funding"], 1)) * 100, 1)
    bench_commits = round((commits_pw / max(avg["commits_per_week"], 0.1)) * 100, 1)

    benchmarks = {
        "stars": {
            "your_value": stars,
            "funded_avg": avg["stars_at_funding"],
            "pct_of_avg": min(bench_stars, 200),
        },
        "forks": {
            "your_value": forks,
            "funded_avg": avg["forks_at_funding"],
            "pct_of_avg": min(bench_forks, 200),
        },
        "contributors": {
            "your_value": contributors,
            "funded_avg": avg["contributors_at_funding"],
            "pct_of_avg": min(bench_contributors, 200),
        },
        "commits_per_week": {
            "your_value": round(commits_pw, 1),
            "funded_avg": avg["commits_per_week"],
            "pct_of_avg": min(bench_commits, 200),
        },
    }

    # ── Velocity Score (0-100) ─────────────────────────────────────────────
    # Dimensions: activity (30%), traction (25%), community (20%), signals (15%), age (10%)
    activity_score = min(100, (commits_pw / max(avg["commits_per_week"], 0.1)) * 50
                         + (1 if has_readme else 0) * 25
                         + (1 if has_license else 0) * 25)

    star_progress = min(1.0, stars / max(avg["stars_at_funding"], 1))
    traction_score = min(100, star_progress * 60
                         + (forks / max(avg["forks_at_funding"], 1)) * 40)

    community_score = min(100, (contributors / max(avg["contributors_at_funding"], 1)) * 70
                          + (min(open_issues, 20) / 20) * 30)

    signals_score = (
        (25 if has_license else 0)
        + (25 if has_readme else 0)
        + (25 if has_homepage else 0)
        + (25 if not is_fork else 0)
    )

    # Age factor: projects 6 months - 3 years old are in the sweet spot
    age_years = age_weeks / 52
    if 0.5 <= age_years <= 3.0:
        age_score = 100
    elif age_years < 0.5:
        age_score = age_years / 0.5 * 100
    else:
        age_score = max(40, 100 - (age_years - 3.0) * 10)

    velocity_score = round(
        activity_score * 0.30
        + min(100, traction_score) * 0.25
        + min(100, community_score) * 0.20
        + signals_score * 0.15
        + age_score * 0.10
    )
    velocity_score = max(0, min(100, velocity_score))

    # ── Predictions: weeks until key grants are reachable ─────────────────
    predictions = []
    quick_wins = []

    for grant_name, thresholds in GRANT_THRESHOLDS.items():
        # Check current eligibility
        gaps = []
        if stars < thresholds["min_stars"]:
            gaps.append(("stars", thresholds["min_stars"] - stars))
        if contributors < thresholds["min_contributors"]:
            gaps.append(("contributors", thresholds["min_contributors"] - contributors))
        if commits_pw < thresholds["min_commits_pw"]:
            gaps.append(("commits_pw", thresholds["min_commits_pw"] - commits_pw))
        if thresholds["needs_license"] and not has_license:
            gaps.append(("license", 1))
        if thresholds["needs_readme"] and not has_readme:
            gaps.append(("readme", 1))

        if not gaps:
            quick_wins.append({
                "grant": grant_name,
                "description": thresholds["description"],
                "status": "ready_now",
                "weeks_away": 0,
            })
            continue

        # Estimate weeks to close each gap
        max_weeks = 0
        gap_descriptions = []

        for gap_type, gap_amount in gaps:
            if gap_type == "stars" and stars_per_week > 0:
                w = math.ceil(gap_amount / stars_per_week)
                max_weeks = max(max_weeks, w)
                gap_descriptions.append(f"+{int(gap_amount)} stars needed")
            elif gap_type == "stars":
                max_weeks = max(max_weeks, 999)
                gap_descriptions.append(f"+{int(gap_amount)} stars needed (no growth detected)")
            elif gap_type == "contributors":
                # Assume 1 new contributor per 4 weeks with active development
                w = int(gap_amount) * 4
                max_weeks = max(max_weeks, w)
                gap_descriptions.append(f"+{int(gap_amount)} contributors needed")
            elif gap_type == "commits_pw":
                # Activity gap — can fix in 4-8 weeks with consistent commits
                max_weeks = max(max_weeks, 8)
                gap_descriptions.append(f"+{gap_amount:.1f} commits/week needed")
            elif gap_type in ("license", "readme"):
                # Can be fixed in 1 week
                max_weeks = max(max_weeks, 1)
                gap_descriptions.append(f"{gap_type.upper()} missing (add in ~1 day)")

        if max_weeks >= 500:
            weeks_label = "500+"
        else:
            weeks_label = max_weeks

        predictions.append({
            "grant": grant_name,
            "description": thresholds["description"],
            "status": "not_ready",
            "weeks_away": weeks_label,
            "gaps": gap_descriptions[:3],
        })

    # Sort predictions: closest first
    predictions.sort(key=lambda x: x["weeks_away"] if isinstance(x["weeks_away"], int) else 9999)
    predictions = predictions[:8]  # top 8

    # ── Improvement tips ──────────────────────────────────────────────────
    improvement_tips = []
    if not has_license:
        improvement_tips.append("Add an OSI-approved license (MIT or Apache-2.0) — unlocks most grants immediately.")
    if not has_readme:
        improvement_tips.append("Write a comprehensive README with project goals, installation, and contributing guide.")
    if commits_pw < 1.0 and age_weeks > 8:
        improvement_tips.append("Increase commit frequency to at least 1 commit/week — funders monitor activity.")
    if contributors < 3:
        improvement_tips.append("Actively recruit 2-3 contributors — most funders require a 'community', not just a solo project.")
    if stars < 100:
        improvement_tips.append("Focus on visibility: write a blog post, post on Hacker News, Reddit, or dev.to.")
    if not has_homepage:
        improvement_tips.append("Create a project homepage or documentation site — signals maturity to funders.")
    if open_issues < 5:
        improvement_tips.append("File detailed GitHub issues for planned work — shows roadmap to funders.")

    metrics = {
        "stars": stars,
        "forks": forks,
        "contributors": contributors,
        "commits_per_week": round(commits_pw, 2),
        "stars_per_week": round(stars_per_week, 2),
        "forks_per_week": round(forks_per_week, 2),
        "age_weeks": round(age_weeks, 1),
        "age_years": round(age_years, 2),
        "has_license": has_license,
        "has_readme": has_readme,
        "has_homepage": has_homepage,
        "is_fork": is_fork,
        "open_issues": open_issues,
    }

    return {
        "velocity_score": velocity_score,
        "score_breakdown": {
            "activity": round(activity_score),
            "traction": round(min(100, traction_score)),
            "community": round(min(100, community_score)),
            "signals": signals_score,
            "age": round(age_score),
        },
        "metrics": metrics,
        "benchmarks": benchmarks,
        "quick_wins": quick_wins[:5],
        "predictions": predictions,
        "improvement_tips": improvement_tips[:5],
    }
