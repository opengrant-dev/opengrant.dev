"""
GitHub API integration.
Fetches comprehensive repo data: stats, topics, README, contributors, commit activity.
Uses httpx for async HTTP calls. Respects rate limits gracefully.
"""

import httpx
import base64
import os
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API_BASE = "https://api.github.com"

# Headers sent with every request
def _headers() -> dict:
    h = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenSourceFundMatcher/1.0",
    }
    if GITHUB_TOKEN:
        h["Authorization"] = f"token {GITHUB_TOKEN}"
    return h


def _parse_repo_url(github_url: str) -> tuple[str, str]:
    """
    Extract owner and repo name from any valid GitHub URL format.
    Supports:
      - https://github.com/owner/repo
      - https://github.com/owner/repo.git
      - github.com/owner/repo
      - owner/repo
    """
    # Strip trailing slashes and .git
    url = github_url.strip().rstrip("/").removesuffix(".git")

    # Remove protocol and domain if present
    match = re.search(r"github\.com[/:](.+)/(.+)$", url)
    if match:
        return match.group(1), match.group(2)

    # Try bare "owner/repo" format
    parts = url.split("/")
    if len(parts) >= 2:
        return parts[-2], parts[-1]

    raise ValueError(f"Cannot parse GitHub URL: {github_url}")


async def fetch_repo_data(github_url: str) -> dict:
    """
    Fetch all relevant data for a GitHub repository.
    Returns a unified dict with repo stats, README, topics, contributors.
    Raises ValueError for invalid URLs or httpx.HTTPStatusError for API errors.
    """
    owner, repo = _parse_repo_url(github_url)
    repo_full_name = f"{owner}/{repo}"

    async with httpx.AsyncClient(headers=_headers(), timeout=20.0) as client:
        # --- Core repo info ---
        repo_resp = await client.get(f"{GITHUB_API_BASE}/repos/{repo_full_name}")
        if repo_resp.status_code == 404:
            raise ValueError(f"Repository '{repo_full_name}' not found on GitHub.")
        if repo_resp.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env to increase limits.")
        repo_resp.raise_for_status()
        repo_data = repo_resp.json()

        # --- Topics ---
        topics_resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{repo_full_name}/topics",
            headers={**_headers(), "Accept": "application/vnd.github.mercy-preview+json"},
        )
        topics = topics_resp.json().get("names", []) if topics_resp.status_code == 200 else []

        # --- README (decoded from base64) ---
        readme_text = ""
        try:
            readme_resp = await client.get(f"{GITHUB_API_BASE}/repos/{repo_full_name}/readme")
            if readme_resp.status_code == 200:
                readme_json = readme_resp.json()
                encoded = readme_json.get("content", "")
                readme_bytes = base64.b64decode(encoded.replace("\n", ""))
                readme_text = readme_bytes.decode("utf-8", errors="replace")[:3000]  # first 3k chars
        except Exception:
            readme_text = ""

        # --- Contributors count ---
        contributors_count = 0
        try:
            contrib_resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{repo_full_name}/contributors",
                params={"per_page": 1, "anon": "false"},
            )
            if contrib_resp.status_code == 200:
                # GitHub returns X-Total count only when using Link pagination
                link_header = contrib_resp.headers.get("Link", "")
                if 'rel="last"' in link_header:
                    # parse page number from last link
                    last_match = re.search(r"page=(\d+)>; rel=\"last\"", link_header)
                    contributors_count = int(last_match.group(1)) if last_match else 1
                else:
                    contributors_count = len(contrib_resp.json())
        except Exception:
            contributors_count = 0

        # --- Weekly commit activity (last 52 weeks) ---
        commit_frequency = 0.0
        try:
            activity_resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{repo_full_name}/stats/participation"
            )
            if activity_resp.status_code == 200:
                all_weeks = activity_resp.json().get("all", [])
                if all_weeks:
                    # avg commits/week over last 12 weeks
                    recent = all_weeks[-12:]
                    commit_frequency = sum(recent) / len(recent)
        except Exception:
            commit_frequency = 0.0

        # --- Assemble result ---
        license_info = repo_data.get("license") or {}
        return {
            "github_url": github_url,
            "repo_name": repo_data.get("full_name", repo_full_name),
            "owner": repo_data.get("owner", {}).get("login", owner),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "watchers": repo_data.get("watchers_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "language": repo_data.get("language"),
            "description": repo_data.get("description", ""),
            "topics": topics,
            "readme_excerpt": readme_text,
            "license_name": license_info.get("spdx_id") or license_info.get("name"),
            "created_at_github": repo_data.get("created_at"),
            "updated_at_github": repo_data.get("updated_at"),
            "homepage": repo_data.get("homepage"),
            "is_fork": repo_data.get("fork", False),
            "has_wiki": repo_data.get("has_wiki", False),
            "has_pages": repo_data.get("has_pages", False),
            "contributors_count": contributors_count,
            "commit_frequency": round(commit_frequency, 2),
        }
