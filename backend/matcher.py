"""
AI Matching Engine — works with any OpenAI-compatible API.
Set LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL in your .env file.
Compatible with: Groq, Together AI, OpenRouter, OpenAI, Mistral, etc.
"""

import json
import os
from typing import Any
from openai import AsyncOpenAI
from llm_utils import get_llm_client

# ── LLM Client — dynamic config via settings.json ──────────────────────────
# Configuration now happens inside run_matching or _score_batch via get_llm_client()
BATCH_SIZE = 10

# Max candidates to send to AI after keyword pre-filter
MAX_CANDIDATES = 25


def _prefilter(repo_data: dict, funding_sources: list[dict]) -> list[dict]:
    """
    Fast keyword-based pre-filter — no AI needed.
    Scores each funding source against repo metadata using simple overlap.
    Returns top MAX_CANDIDATES sorted by keyword score.
    """
    lang = (repo_data.get("language") or "").lower()
    topics = [t.lower() for t in (repo_data.get("topics") or [])]
    desc = (repo_data.get("description") or "").lower()
    readme = (repo_data.get("readme_excerpt") or "").lower()
    repo_text = f"{lang} {desc} {readme} {' '.join(topics)}"

    # Keywords that signal repo type
    repo_signals = set(repo_text.split())
    # Add topic words directly
    repo_signals.update(topics)
    if lang:
        repo_signals.add(lang)

    scored = []
    for fs in funding_sources:
        score = 0
        fs_text = " ".join([
            fs.get("name", ""),
            fs.get("description", ""),
            " ".join(fs.get("tags", [])),
            " ".join(fs.get("focus_areas", [])),
        ]).lower()

        fs_words = set(fs_text.split())

        # Keyword overlap
        overlap = repo_signals & fs_words
        score += len(overlap) * 2

        # Focus area exact match bonus
        for area in (fs.get("focus_areas") or []):
            if area.lower() in repo_text or area.lower() == "any":
                score += 5

        # Tag match bonus
        for tag in (fs.get("tags") or []):
            if tag.lower() in repo_text:
                score += 3

        # "any" focus = always include with base score
        if "any" in [a.lower() for a in (fs.get("focus_areas") or [])]:
            score += 8

        # Global eligibility bonus
        elig = (fs.get("eligibility") or {}).get("location", "").lower()
        if "global" in elig:
            score += 4

        scored.append((score, fs))

    # Sort by score descending, take top MAX_CANDIDATES
    scored.sort(key=lambda x: x[0], reverse=True)
    return [fs for _, fs in scored[:MAX_CANDIDATES]]


def _build_repo_summary(repo_data: dict) -> str:
    """Create a concise, structured summary of the repo for the LLM."""
    topics = ", ".join(repo_data.get("topics", [])) or "none"
    return f"""
REPOSITORY SUMMARY
==================
Name:         {repo_data.get("repo_name", "unknown")}
Description:  {repo_data.get("description", "none")}
Language:     {repo_data.get("language", "unknown")}
Stars:        {repo_data.get("stars", 0):,}
Forks:        {repo_data.get("forks", 0):,}
Contributors: {repo_data.get("contributors_count", 0)}
Commit freq:  {repo_data.get("commit_frequency", 0):.1f} commits/week (12-wk avg)
Open issues:  {repo_data.get("open_issues", 0)}
License:      {repo_data.get("license_name", "unknown")}
Topics/Tags:  {topics}
Has homepage: {bool(repo_data.get("homepage"))}
Is a fork:    {repo_data.get("is_fork", False)}

README excerpt (first 2000 chars):
---
{(repo_data.get("readme_excerpt") or "Not available")[:2000]}
---
""".strip()


def _build_funding_summary(funding_source: dict) -> str:
    """Create a concise summary of a funding source for the LLM."""
    amount = ""
    if funding_source.get("min_amount") and funding_source.get("max_amount"):
        amount = f"${funding_source['min_amount']:,} – ${funding_source['max_amount']:,}"
    elif funding_source.get("max_amount"):
        amount = f"up to ${funding_source['max_amount']:,}"
    elif funding_source.get("min_amount"):
        amount = f"from ${funding_source['min_amount']:,}"
    else:
        amount = "variable"

    tags = ", ".join(funding_source.get("tags", []))
    focus = ", ".join(funding_source.get("focus_areas", []))
    eligibility = funding_source.get("eligibility", {})
    elig_str = f"{eligibility.get('location', 'global')}, {eligibility.get('type', 'any')}"

    fid = funding_source.get('id', 'N/A')
    name = funding_source.get('name', 'Unknown')
    cat = funding_source.get('category', 'General')
    ftype = funding_source.get('type', 'Grant')
    
    return (
        f"ID:{fid} | {name} ({cat}) | "
        f"{ftype} | {amount} | Focus: {focus} | "
        f"Eligibility: {elig_str} | Tags: {tags}"
    )


SYSTEM_PROMPT = """You are an expert grant writer and open source funding advisor with deep knowledge of
technology funding programs, grants, accelerators, and sponsorships.

Your job: given a GitHub repository's details and a list of funding opportunities, score how well
each opportunity matches the repository (0-100) and explain why.

Be SPECIFIC and ACTIONABLE. Reference actual repo stats and funding criteria.
Avoid generic advice — tailor every insight to this specific repo and funding source.

Scoring guide:
  90-100: Exceptional match — repo meets nearly all criteria, high probability of success
  70-89:  Strong match — repo clearly fits, minor gaps
  50-69:  Moderate match — worth applying but needs some work
  30-49:  Weak match — possible but significant barriers
  0-29:   Poor match — unlikely to succeed

You MUST respond with a valid JSON object containing a "matches" key whose value is an array.
Example structure:
{
  "matches": [
    {
      "funding_id": <int>,
      "score": <int 0-100>,
      "reasoning": "<2-3 sentence summary>",
      "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
      "gaps": ["<gap 1>", "<gap 2>"],
      "application_tips": "<Specific actionable advice>"
    }
  ]
}"""


async def _score_batch(repo_summary: str, funding_batch: list[dict]) -> list[dict]:
    """
    Ask GPT-4 to score a batch of funding sources against the repo.
    Returns parsed JSON list of match objects.
    """
    funding_list = "\n".join(_build_funding_summary(f) for f in funding_batch)

    user_msg = f"""
{repo_summary}

FUNDING OPPORTUNITIES TO EVALUATE:
{funding_list}

Score EACH of the {len(funding_batch)} funding opportunities above against this repository.
Return a JSON object with a "matches" array containing one entry per funding opportunity.
"""

    client, model = get_llm_client()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=6000,
    )

    content = response.choices[0].message.content
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        # Try to extract JSON from the response if it has extra text
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
        else:
            return []

    # Handle case where Ollama/Local LLMs return the array directly or in a weird wrapper
    if isinstance(parsed, dict):
        # Look for the matches array in common keys
        for key in ("matches", "results", "funding_matches", "scores", "data"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        # Or if the whole dict *is* the match (happens if batch_size=1)
        if "score" in parsed and "funding_id" in parsed:
            return [parsed]
        # fallback: first list value
        for v in parsed.values():
            if isinstance(v, list):
                return v
    if isinstance(parsed, list):
        return parsed

    return []


async def run_matching(repo_data: dict, funding_sources: list[Any]) -> list[dict]:
    """
    Main entry point: run AI matching for a repo against all funding sources.

    Args:
        repo_data: dict from github_api.fetch_repo_data() or Repo model
        funding_sources: list of FundingSource ORM objects or dicts

    Returns:
        List of match dicts sorted by score descending, including funding source metadata.
    """
    if not funding_sources:
        return []

    # Convert ORM objects to dicts for prompt building
    def to_dict(fs, idx) -> dict:
        if isinstance(fs, dict):
            # Assign temporary ID if missing (common in CLI raw data)
            if "id" not in fs:
                fs["id"] = f"raw_{idx}"
            return fs
        return {
            "id": fs.id,
            "name": fs.name,
            "type": fs.type,
            "min_amount": fs.min_amount,
            "max_amount": fs.max_amount,
            "description": fs.description,
            "url": fs.url,
            "category": fs.category,
            "tags": fs.tags or [],
            "eligibility": fs.eligibility or {},
            "focus_areas": fs.focus_areas or [],
            "is_recurring": fs.is_recurring,
        }

    funding_dicts = [to_dict(fs, i) for i, fs in enumerate(funding_sources)]
    repo_summary = _build_repo_summary(repo_data)

    # ── Smart pre-filter: keyword match to top candidates before AI scoring ──
    # This cuts 183 sources down to ~25, making local models fast enough
    candidates = _prefilter(repo_data, funding_dicts)

    # Process in batches to stay within token limits
    all_scores: list[dict] = []
    for i in range(0, len(candidates), BATCH_SIZE):
        batch = candidates[i : i + BATCH_SIZE]
        batch_scores = await _score_batch(repo_summary, batch)
        all_scores.extend(batch_scores)

    # Attach funding metadata to each score
    funding_by_id = {fs["id"]: fs for fs in funding_dicts}
    enriched: list[dict] = []
    for score_obj in all_scores:
        fid = score_obj.get("funding_id")
        if fid and fid in funding_by_id:
            enriched.append({
                **score_obj,
                "funding": funding_by_id[fid],
            })

    # Sort by score descending
    enriched.sort(key=lambda x: x.get("score", 0), reverse=True)
    return enriched
