"""
GitHub Org Scanner
===================
Fetches all public repos for a GitHub org/user and runs instant fundability
analysis on each one. Returns repos ranked by fundability score.
"""

import os
import httpx
from dotenv import load_dotenv
from fundability import analyze_fundability

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
MAX_REPOS = 100


def _headers() -> dict:
    h = {"Accept": "application/vnd.github.v3+json", "User-Agent": "FundMatcher/1.0"}
    if GITHUB_TOKEN:
        h["Authorization"] = f"token {GITHUB_TOKEN}"
    return h


def _normalize_name(org_input: str) -> str:
    """Extract org/user name from a GitHub URL or plain name."""
    s = org_input.strip().rstrip("/")
    if "github.com/" in s:
        parts = s.split("github.com/")[-1].split("/")
        return parts[0]
    return s


async def scan_org(org_input: str) -> dict:
    """
    Scan a GitHub org or user and return all public repos with fundability scores.
    Returns:
        {
            "org": str,
            "type": "org" | "user",
            "avatar_url": str,
            "total_repos": int,
            "repos": [{ repo fields + fundability }]
        }
    """
    org_name = _normalize_name(org_input)
    results = []
    org_info = {}

    async with httpx.AsyncClient(headers=_headers(), timeout=30.0) as client:
        # Try org first, fall back to user
        org_resp = await client.get(f"https://api.github.com/orgs/{org_name}")
        if org_resp.status_code == 200:
            data = org_resp.json()
            entity_type = "org"
            org_info = {
                "org": org_name,
                "type": "org",
                "name": data.get("name") or org_name,
                "avatar_url": data.get("avatar_url", ""),
                "description": data.get("description", ""),
                "public_repos": data.get("public_repos", 0),
                "html_url": data.get("html_url", f"https://github.com/{org_name}"),
            }
            repos_url = f"https://api.github.com/orgs/{org_name}/repos"
        else:
            user_resp = await client.get(f"https://api.github.com/users/{org_name}")
            if user_resp.status_code != 200:
                raise ValueError(f"Could not find GitHub org or user: '{org_name}'")
            data = user_resp.json()
            entity_type = "user"
            org_info = {
                "org": org_name,
                "type": "user",
                "name": data.get("name") or org_name,
                "avatar_url": data.get("avatar_url", ""),
                "description": data.get("bio", ""),
                "public_repos": data.get("public_repos", 0),
                "html_url": data.get("html_url", f"https://github.com/{org_name}"),
            }
            repos_url = f"https://api.github.com/users/{org_name}/repos"

        # Paginate repos (up to MAX_REPOS)
        raw_repos = []
        page = 1
        while len(raw_repos) < MAX_REPOS:
            resp = await client.get(
                repos_url,
                params={"per_page": 30, "page": page, "sort": "updated", "type": "public"},
            )
            if resp.status_code != 200:
                break
            batch = resp.json()
            if not batch:
                break
            raw_repos.extend(batch)
            page += 1
            if len(batch) < 30:
                break

    # Analyze each repo
    for r in raw_repos[:MAX_REPOS]:
        if r.get("fork"):
            continue  # Skip forks

        license_info = r.get("license") or {}
        topics = r.get("topics") or []

        repo_dict = {
            "repo_name": r.get("full_name", ""),
            "description": r.get("description", ""),
            "language": r.get("language"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "contributors_count": 0,    # Not fetched in bulk for speed
            "commit_frequency": 0.0,    # Not fetched in bulk for speed
            "open_issues": r.get("open_issues_count", 0),
            "license_name": license_info.get("spdx_id") or license_info.get("name", ""),
            "topics": topics,
            "readme_excerpt": "",       # Not fetched in bulk
            "homepage": r.get("homepage", ""),
            "is_fork": r.get("fork", False),
            "has_pages": r.get("has_pages", False),
            "has_wiki": r.get("has_wiki", False),
        }

        fundability = analyze_fundability(repo_dict)

        results.append({
            "repo_name": r.get("full_name", ""),
            "github_url": r.get("html_url", ""),
            "description": r.get("description", ""),
            "language": r.get("language"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "open_issues": r.get("open_issues_count", 0),
            "topics": topics,
            "license": license_info.get("spdx_id", ""),
            "updated_at": r.get("updated_at", ""),
            "is_fork": r.get("fork", False),
            "fundability_score": fundability["total_score"],
            "fundability_grade": fundability["grade"],
            "fundability_verdict": fundability["verdict"],
            "critical_issues": fundability["tip_counts"]["critical"],
        })

    # Sort by fundability score descending
    results.sort(key=lambda x: x["fundability_score"], reverse=True)

    return {
        **org_info,
        "repos": results,
        "total_analyzed": len(results),
    }
