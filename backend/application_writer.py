"""
AI Grant Application Writer
============================
Given a repo + funding source, generates a complete, ready-to-submit grant application
using Groq's llama-3.3-70b-versatile model.

Sections generated:
  - Executive Summary
  - Problem Statement
  - Solution & Technical Approach
  - Timeline with Milestones
  - Budget Breakdown
  - Impact & Sustainability Plan
  - Why This Fund (fund-specific)
  - Team Description
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

WRITER_SYSTEM_PROMPT = """You are a world-class grant writer who has helped open source projects
secure over $50M in funding from Mozilla, Linux Foundation, NSF, and major tech companies.

Your task: write a complete, compelling, ready-to-submit grant application tailored SPECIFICALLY
to both the repository and the funding source provided.

Rules:
- Be specific — use actual repo stats (stars, contributors, language, topics)
- Tailor every section to the SPECIFIC fund's priorities and criteria
- Make it sound authentic, not templated
- Use concrete numbers and milestones
- Be ambitious but realistic about impact

Respond with a JSON object (no markdown) with this exact structure:
{
  "executive_summary": "2-3 paragraph hook that immediately shows fit with this specific fund",
  "problem_statement": "What critical problem does this project solve? Why does it matter?",
  "solution_description": "How does the project solve it? What makes the approach unique?",
  "technical_approach": "Technical details, architecture, methodology — shows credibility",
  "timeline": [
    {"phase": "Month 1-2", "milestone": "...", "deliverable": "..."},
    {"phase": "Month 3-4", "milestone": "...", "deliverable": "..."},
    {"phase": "Month 5-6", "milestone": "...", "deliverable": "..."}
  ],
  "budget": [
    {"item": "Developer time (X months)", "amount": 0, "justification": "..."},
    {"item": "Infrastructure & hosting", "amount": 0, "justification": "..."},
    {"item": "Community & outreach", "amount": 0, "justification": "..."}
  ],
  "impact_statement": "Concrete, measurable impact — who benefits, how many, by when",
  "sustainability_plan": "How will this project sustain itself after the grant period?",
  "why_this_fund": "Why is THIS fund the perfect partner? Reference their specific mission/values",
  "team_description": "Who maintains this project? Track record, expertise, commitment"
}"""


async def generate_application(repo: dict, funding_source: dict) -> dict:
    """
    Generate a complete grant application for a repo + funding source pair.
    Returns a dict with all application sections.
    """
    # Build repo context
    topics = ", ".join(repo.get("topics") or []) or "none"
    budget_hint = ""
    if funding_source.get("min_amount") and funding_source.get("max_amount"):
        budget_hint = f"Grant range: ${funding_source['min_amount']:,} – ${funding_source['max_amount']:,}. Create a realistic budget within this range."
    elif funding_source.get("max_amount"):
        budget_hint = f"Maximum grant: ${funding_source['max_amount']:,}. Create a realistic budget up to this amount."
    else:
        budget_hint = "Variable funding amount. Create a realistic budget based on project needs."

    user_msg = f"""
REPOSITORY TO WRITE APPLICATION FOR:
=====================================
Name: {repo.get('repo_name', 'Unknown')}
Description: {repo.get('description', 'No description')}
Language: {repo.get('language', 'Unknown')}
Stars: {repo.get('stars', 0):,}
Forks: {repo.get('forks', 0):,}
Contributors: {repo.get('contributors_count', 0)}
Commit frequency: {repo.get('commit_frequency', 0):.1f} commits/week
Open issues: {repo.get('open_issues', 0)}
License: {repo.get('license_name', 'Unknown')}
Topics: {topics}
Is fork: {repo.get('is_fork', False)}
Has homepage: {bool(repo.get('homepage'))}
GitHub URL: {repo.get('github_url', '')}

README Excerpt:
---
{(repo.get('readme_excerpt') or 'Not available')[:2000]}
---

FUNDING SOURCE TO APPLY TO:
=====================================
Name: {funding_source.get('name')}
Type: {funding_source.get('type')} ({funding_source.get('category')})
Description: {funding_source.get('description')}
Focus areas: {', '.join(funding_source.get('focus_areas') or [])}
Tags: {', '.join(funding_source.get('tags') or [])}
Eligibility: {json.dumps(funding_source.get('eligibility') or {})}
{budget_hint}
Application URL: {funding_source.get('url')}

Write a COMPLETE, COMPELLING grant application. Make it specific to both this repo and this fund.
Every section should demonstrate deep understanding of the project and why this fund is the ideal partner.
"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": WRITER_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
        max_tokens=6000,
    )

    content = response.choices[0].message.content
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', content, re.DOTALL)
        if m:
            result = json.loads(m.group())
        else:
            result = {"error": "Failed to parse application. Please try again."}

    # Calculate total budget
    budget = result.get("budget", [])
    total_budget = sum(item.get("amount", 0) for item in budget)
    result["total_budget"] = total_budget
    result["funding_source_name"] = funding_source.get("name")
    result["funding_source_url"] = funding_source.get("url")
    result["repo_name"] = repo.get("repo_name")

    return result
