"""
OSS Funding Time Machine
=========================
LLM-powered 90-day roadmap generator.
Given a repo's current state and target funding sources,
produces a precise week-by-week action plan to maximize funding success.
"""

import json
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("LLM_API_KEY", ""),
    base_url=os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1"),
)
MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

ROADMAP_SYSTEM_PROMPT = """You are an elite OSS funding strategist who has helped 200+ open source
projects secure grants from Mozilla, NLnet, NSF, Linux Foundation, and other major funders.

Your task: Given a GitHub repository's current state and a list of target funding sources,
generate a precise, actionable 90-day roadmap that maximizes the project's chance of receiving
funding from ALL listed sources simultaneously.

Focus on:
- Specific, measurable actions (not vague advice)
- Sequencing that unlocks the most gates fastest
- Grant-specific requirements each funder looks for
- Community building milestones that funders verify
- Technical credibility signals (CI, tests, docs, security)

Respond ONLY with a JSON object (no markdown, no extra text) with this EXACT structure:
{
  "summary": "2-3 sentence executive summary of the roadmap strategy",
  "readiness_assessment": "Current state vs requirements — what's already strong, what needs work",
  "milestones": [
    {
      "week": "Week 1-2",
      "theme": "Foundation & Quick Wins",
      "actions": [
        {"action": "Specific action", "impact": "Why this matters to funders", "effort": "low|medium|high"}
      ]
    }
  ],
  "grant_specific_tips": {
    "GRANT_NAME": "Specific advice for this grant's unique requirements and reviewer preferences"
  },
  "estimated_ready_date": "YYYY-MM-DD estimate for when the strongest grant application can be submitted",
  "success_probability": "Brief assessment: likelihood of success if roadmap is followed",
  "red_flags": ["Critical issues that MUST be fixed before applying to any grant"]
}

Generate exactly 6 milestone blocks covering weeks 1-2, 3-4, 5-6, 7-8, 9-10, and 11-13."""


async def generate_roadmap(repo: dict, funding_sources: list[dict]) -> dict:
    """
    Generate a 90-day funding roadmap for a repo targeting specific funding sources.

    Args:
        repo: Repo data dict (stars, forks, language, topics, etc.)
        funding_sources: List of funding source dicts [{name, description, focus_areas, ...}]

    Returns:
        Roadmap dict with milestones, tips, and predictions
    """
    topics = ", ".join(repo.get("topics") or []) or "none"

    grant_list = "\n".join([
        f"- {fs.get('name', 'Unknown')} ({fs.get('category', 'grant')}): "
        f"{fs.get('description', '')[:200]}. "
        f"Focus: {', '.join(fs.get('focus_areas') or [])}. "
        f"Amount: ${fs.get('min_amount', 0):,}–${fs.get('max_amount', 0):,}"
        for fs in funding_sources[:5]
    ])

    user_msg = f"""
REPOSITORY TO BUILD A ROADMAP FOR:
====================================
Name: {repo.get('repo_name', 'Unknown')}
Description: {repo.get('description', 'No description')}
Language: {repo.get('language', 'Unknown')}
Stars: {repo.get('stars', 0):,}
Forks: {repo.get('forks', 0):,}
Contributors: {repo.get('contributors_count', 0)}
Commit frequency: {repo.get('commit_frequency', 0):.1f} commits/week
Open issues: {repo.get('open_issues', 0)}
License: {repo.get('license_name', 'MISSING — no license')}
Topics: {topics}
Has homepage/docs: {bool(repo.get('homepage'))}
Is fork: {repo.get('is_fork', False)}
GitHub URL: {repo.get('github_url', '')}

README excerpt:
---
{(repo.get('readme_excerpt') or 'No README found')[:1500]}
---

TARGET FUNDING SOURCES (applying to all simultaneously):
=========================================================
{grant_list}

Generate a precise 90-day action plan to maximize success with ALL of the above funders.
Prioritize actions that unlock the most gates across multiple funders simultaneously.
Be SPECIFIC about which week to do what, and WHY it matters to these specific funders.
"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.35,
        response_format={"type": "json_object"},
        max_tokens=5000,
    )

    content = response.choices[0].message.content
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', content, re.DOTALL)
        if m:
            try:
                result = json.loads(m.group())
            except Exception:
                result = _fallback_roadmap(repo, funding_sources)
        else:
            result = _fallback_roadmap(repo, funding_sources)

    # Ensure required keys exist
    result.setdefault("summary", "90-day roadmap generated.")
    result.setdefault("milestones", [])
    result.setdefault("grant_specific_tips", {})
    result.setdefault("estimated_ready_date", "")
    result.setdefault("success_probability", "")
    result.setdefault("red_flags", [])
    result.setdefault("readiness_assessment", "")

    # Attach metadata
    result["repo_name"] = repo.get("repo_name")
    result["target_grants"] = [fs.get("name") for fs in funding_sources]

    return result


def _fallback_roadmap(repo: dict, funding_sources: list[dict]) -> dict:
    """Fallback static roadmap if LLM fails."""
    grant_names = [fs.get("name", "Unknown") for fs in funding_sources]
    has_license = bool(repo.get("license_name"))
    has_readme = bool(repo.get("readme_excerpt"))
    stars = int(repo.get("stars") or 0)

    red_flags = []
    if not has_license:
        red_flags.append("No OSI-approved license detected — required by virtually all funders.")
    if not has_readme:
        red_flags.append("No README found — required before any grant application.")
    if stars < 50:
        red_flags.append("Very low star count — build community visibility before applying.")

    return {
        "summary": (
            f"90-day roadmap to prepare {repo.get('repo_name', 'your project')} "
            f"for {', '.join(grant_names[:3])}. "
            "Focus on foundation-building in weeks 1-4, community in weeks 5-8, "
            "and application polish in weeks 9-12."
        ),
        "readiness_assessment": (
            f"Current state: {repo.get('stars', 0)} stars, "
            f"{repo.get('contributors_count', 0)} contributors, "
            f"{'has license' if has_license else 'NO LICENSE'}. "
            "Immediate priority: fix red flags before drafting applications."
        ),
        "milestones": [
            {
                "week": "Week 1-2",
                "theme": "Foundation",
                "actions": [
                    {"action": "Add MIT or Apache-2.0 license", "impact": "Unlocks 95% of grants", "effort": "low"},
                    {"action": "Write comprehensive README with install + contribute guide", "impact": "Required by all funders", "effort": "medium"},
                    {"action": "Set up GitHub Issues with labeled roadmap", "impact": "Shows project direction", "effort": "low"},
                ]
            },
            {
                "week": "Week 3-4",
                "theme": "Technical Credibility",
                "actions": [
                    {"action": "Add CI/CD pipeline (GitHub Actions)", "impact": "Required by technical funders", "effort": "medium"},
                    {"action": "Write test suite with ≥60% coverage", "impact": "Critical for security/infrastructure grants", "effort": "high"},
                    {"action": "Create CONTRIBUTING.md", "impact": "Signals community-readiness", "effort": "low"},
                ]
            },
            {
                "week": "Week 5-6",
                "theme": "Community Building",
                "actions": [
                    {"action": "Post launch announcement on HN, Reddit r/programming, dev.to", "impact": "Drives stars and visibility", "effort": "medium"},
                    {"action": "Create project Discord or Matrix channel", "impact": "Community channel required by Mozilla, NLnet", "effort": "low"},
                    {"action": "Respond to all open issues and PRs", "impact": "Activity score improvement", "effort": "medium"},
                ]
            },
            {
                "week": "Week 7-8",
                "theme": "Documentation & Demos",
                "actions": [
                    {"action": "Create project homepage or GitHub Pages docs site", "impact": "Maturity signal for large funders", "effort": "medium"},
                    {"action": "Record 3-5 minute demo video", "impact": "Helps reviewers understand scope quickly", "effort": "medium"},
                    {"action": "Write a technical blog post about the project", "impact": "Shows communication ability", "effort": "medium"},
                ]
            },
            {
                "week": "Week 9-10",
                "theme": "Application Drafting",
                "actions": [
                    {"action": "Draft core application narrative (problem, solution, impact)", "impact": "Reusable across all target grants", "effort": "high"},
                    {"action": "Prepare budget spreadsheet with justifications", "impact": "Required for all grants", "effort": "medium"},
                    {"action": "Identify and brief 2 references/advisors", "impact": "Many funders require references", "effort": "medium"},
                ]
            },
            {
                "week": "Week 11-13",
                "theme": "Submit & Follow Up",
                "actions": [
                    {"action": f"Submit to {grant_names[0] if grant_names else 'first target grant'}", "impact": "Start funding pipeline", "effort": "high"},
                    {"action": "Apply to quick-win grants (GitHub Sponsors, Open Collective)", "impact": "Immediate income + social proof", "effort": "low"},
                    {"action": "Send intro emails to community leads at target funders", "impact": "Warm lead before formal review", "effort": "medium"},
                ]
            },
        ],
        "grant_specific_tips": {
            name: f"Review {name}'s specific criteria and tailor the impact statement to their focus areas."
            for name in grant_names[:3]
        },
        "estimated_ready_date": "",
        "success_probability": "Moderate — follow the roadmap consistently for best results.",
        "red_flags": red_flags,
    }
