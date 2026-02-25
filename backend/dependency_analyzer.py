import os
import re
import json
import httpx
from typing import List, Dict, Any

async def analyze_dependencies(content: str, ecosystem: str) -> List[Dict[str, Any]]:
    """
    Parse a package.json or requirements.txt and check each dependency's
    funding health on GitHub.
    """
    ecosystem = ecosystem.lower()
    content = content.strip()
    packages = []

    # ── Parse package names ─────────────────────────────────────────────
    if ecosystem == "npm":
        try:
            parsed = json.loads(content)
            deps = {**parsed.get("dependencies", {}), **parsed.get("devDependencies", {})}
            packages = list(deps.keys())[:30]
        except Exception:
            raise ValueError("Invalid package.json")
    else:  # pip
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            pkg = re.split(r"[>=<!;\[]", line)[0].strip()
            if pkg:
                packages.append(pkg)
        packages = packages[:30]

    if not packages:
        raise ValueError("No packages found.")

    results = []
    gh_token = os.getenv("GITHUB_TOKEN", "")
    gh_headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "FundMatcher/1.0",
        **({"Authorization": f"token {gh_token}"} if gh_token else {}),
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        for pkg in packages:
            github_url = None
            # Resolve GitHub URL from registry
            try:
                if ecosystem == "npm":
                    r = await client.get(f"https://registry.npmjs.org/{pkg}/latest")
                    if r.status_code == 200:
                        data = r.json()
                        repo = data.get("repository", {})
                        rawurl = repo.get("url", "") if isinstance(repo, dict) else ""
                        match = re.search(r"github\.com[/:]([^/]+/[^/.\s]+)", rawurl)
                        if match:
                            github_url = f"https://github.com/{match.group(1).removesuffix('.git')}"
                else:
                    r = await client.get(f"https://pypi.org/pypi/{pkg}/json")
                    if r.status_code == 200:
                        info = r.json().get("info", {})
                        urls = info.get("project_urls") or {}
                        for k, v in urls.items():
                            if "github.com" in (v or ""):
                                m = re.search(r"github\.com/([^/]+/[^/\s]+)", v)
                                if m:
                                    github_url = f"https://github.com/{m.group(1).rstrip('/')}"
                                    break
                        if not github_url:
                            hp = info.get("home_page") or ""
                            if "github.com" in hp:
                                m = re.search(r"github\.com/([^/]+/[^/\s]+)", hp)
                                if m:
                                    github_url = f"https://github.com/{m.group(1).rstrip('/')}"
            except Exception:
                pass

            # Fetch GitHub stats
            stars = 0
            has_sponsors = False

            if github_url:
                try:
                    path = github_url.replace("https://github.com/", "")
                    r = await client.get(f"https://api.github.com/repos/{path}", headers=gh_headers)
                    if r.status_code == 200:
                        d = r.json()
                        stars = d.get("stargazers_count", 0)

                    fund_r = await client.get(
                        f"https://api.github.com/repos/{path}/contents/.github/FUNDING.yml",
                        headers=gh_headers,
                    )
                    has_sponsors = fund_r.status_code == 200
                except Exception:
                    pass

            results.append({
                "name": pkg,
                "github_url": github_url,
                "stars": stars,
                "has_sponsors": has_sponsors
            })
    return results
