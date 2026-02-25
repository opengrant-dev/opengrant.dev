import os
import httpx
import re
from typing import List, Dict, Any
from github_api import _headers, GITHUB_API_BASE
from llm_utils import get_llm_client

# ── LLM Client — dynamic config via settings.json ──────────────────────────
# Configuration happens inside generate_monetization_strategy via get_llm_client()

async def fetch_live_bounties(query: str = "label:bounty label:\"help wanted\" state:open") -> List[Dict[str, Any]]:
    """
    Search GitHub for open issues with bounty-related labels.
    In a real scenario, this would also query platforms like Gitcoin, Bountysource, etc.
    For this implementation, we focus on GitHub's native ecosystem.
    """
    search_url = f"{GITHUB_API_BASE}/search/issues"
    params = {
        "q": f"{query} type:issue",
        "sort": "created",
        "order": "desc",
        "per_page": 20
    }
    
    async with httpx.AsyncClient(headers=_headers(), timeout=20.0) as client:
        try:
            resp = await client.get(search_url, params=params)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            
            bounties = []
            for item in items:
                repo_url = item.get("repository_url", "")
                repo_name = "/".join(repo_url.split("/")[-2:])
                
                # Mocking amount and platform for now as GitHub doesn't have native bounty amounts
                # In a production app, we'd cross-reference with Bountysource/Algora APIs
                bounties.append({
                    "id": str(item.get("id")),
                    "title": item.get("title"),
                    "repo": repo_name,
                    "amount": 100 if "bounty" in [l["name"].lower() for l in item.get("labels", [])] else 50,
                    "tags": [l["name"] for l in item.get("labels", [])][:3],
                    "level": "Intermediate", # Defaulting as GitHub doesn't specify
                    "platform": "GitHub Issues",
                    "url": item.get("html_url"),
                    "posted": item.get("created_at")
                })
            return bounties
        except Exception as e:
            print(f"Error fetching bounties: {e}")
            return []

async def generate_monetization_strategy(repo_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use LLM to generate a custom monetization strategy, FUNDING.yml, and README copy.
    """
    model = os.getenv("LLM_MODEL", "gpt-4-turbo-preview")
    
    prompt = f"""
    You are a Senior OSS Monetization Expert. Analyze this GitHub project and generate a recurring revenue strategy.
    
    REPO: {repo_data.get('repo_name')}
    DESCRIPTION: {repo_data.get('description')}
    TOPICS: {', '.join(repo_data.get('topics', []))}
    STARS: {repo_data.get('stars')}
    
    OUTPUT JSON FORMAT:
    {{
      "fundingYml": "string content for .github/FUNDING.yml",
      "readmeSnippet": "markdown snippet for README.md",
      "tips": ["tip1", "tip2", "tip3"]
    }}
    
    Include content for GitHub Sponsors, Patreon, and Open Collective if applicable.
    The README snippet should be persuasive and professional.
    """
    
    try:
        client, model = get_llm_client()
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            response_format={"type": "json_object"}
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        # Fallback if LLM fails
        return {
            "fundingYml": f"github: [{repo_data.get('owner')}]",
            "readmeSnippet": f"### 💖 Support {repo_data.get('repo_name')}\n\nMaintainers invest significant time in this project. Please consider sponsoring!",
            "tips": ["Enable GitHub Sponsors", "Add a FUNDING.yml file", "Link your Patreon"]
        }
