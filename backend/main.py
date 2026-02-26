"""
OpenGrant — FastAPI Backend
==========================================
Endpoints:
  POST   /api/repos/submit            Submit a GitHub repo URL for analysis
  GET    /api/repos/{repo_id}         Get repo details + analysis status
  GET    /api/repos/{repo_id}/matches Get AI-matched funding opportunities
  GET    /api/funding-sources         List all available funding sources
  POST   /api/matches/details         Get detailed analysis for a single match
  GET    /api/stats                   Platform statistics (for landing page)
  GET    /health                      Health check
"""

import os
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, field_validator
from pydantic import ConfigDict
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from models import init_db, get_db, Repo, FundingSource, Match
from github_api import fetch_repo_data
from matcher import run_matching
from funding_db import seed_funding_sources, get_all_funding_sources
from application_writer import generate_application
from fundability import analyze_fundability
from badge import generate_badge_svg
from org_scanner import scan_org
from funded_dna import compare_repo_to_funded_dna
from portfolio import optimize_portfolio
from velocity import calculate_velocity
from time_machine import generate_roadmap
from monetization import fetch_live_bounties, generate_monetization_strategy
from llm_utils import load_settings, save_settings

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: init DB and seed funding data
    init_db()
    db = next(get_db())
    try:
        seed_funding_sources(db)
    finally:
        db.close()
    yield
    # Shutdown (nothing to clean up)


_IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"
app = FastAPI(
    title="OpenGrant API",
    description="AI-powered matching between GitHub repos and funding opportunities.",
    version="1.0.0",
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    print("--- REGISTERED ROUTES ---")
    for route in app.routes:
        print(f"{route.path} [{route.methods if hasattr(route, 'methods') else 'N/A'}]")
    print("-------------------------")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "https://opengrant.dev",  # production domain (update when deploying)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RepoSubmitRequest(BaseModel):
    github_url: str

    @field_validator("github_url")
    @classmethod
    def must_be_github(cls, v: str) -> str:
        import re
        v = v.strip()
        # Strict: must match https://github.com/owner/repo
        pattern = r'^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$'
        if not re.match(pattern, v):
            raise ValueError("Please provide a valid GitHub URL: https://github.com/owner/repo")
        return v.rstrip('/')


class MatchDetailsRequest(BaseModel):
    repo_id: str
    funding_id: int


class RepoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    repo_name: str
    github_url: str
    stars: int
    forks: int
    language: Optional[str]
    description: Optional[str]
    topics: list
    status: str
    created_at: str


class FundingSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    min_amount: int
    max_amount: int
    description: str
    url: str
    category: str
    tags: list
    focus_areas: list
    is_recurring: bool
    deadline: Optional[str]


class MatchResponse(BaseModel):
    id: str
    repo_id: str
    funding_id: int
    match_score: float
    reasoning: str
    strengths: list
    gaps: list
    application_tips: Optional[str]
    funding_source: FundingSourceResponse


# ---------------------------------------------------------------------------
# Background task: analyze repo + run matching
# ---------------------------------------------------------------------------
async def _analyze_and_match(repo_id: str):
    """
    Background task that:
    1. Fetches GitHub data for the repo
    2. Runs AI matching against all funding sources
    3. Saves results to the database
    """
    db = next(get_db())
    try:
        repo = db.query(Repo).filter(Repo.id == repo_id).first()
        if not repo:
            return

        # 1. Fetch GitHub data
        try:
            gh_data = await fetch_repo_data(repo.github_url)
        except ValueError as e:
            repo.status = "error"
            repo.error_message = str(e)
            db.commit()
            return
        except Exception as e:
            repo.status = "error"
            repo.error_message = f"GitHub API error: {str(e)}"
            db.commit()
            return

        # 2. Update repo with GitHub data
        for field, value in gh_data.items():
            if hasattr(repo, field) and field != "id":
                setattr(repo, field, value)

        # Parse datetime strings
        for dt_field in ("created_at_github", "updated_at_github"):
            val = gh_data.get(dt_field)
            if val and isinstance(val, str):
                try:
                    setattr(repo, dt_field, datetime.fromisoformat(val.replace("Z", "+00:00")))
                except Exception:
                    pass

        db.commit()

        # 3. Run AI matching
        funding_sources = get_all_funding_sources(db)
        repo_dict = {
            c.name: getattr(repo, c.name)
            for c in repo.__table__.columns
        }
        # JSON fields stored as strings in SQLite — decode if needed
        for json_field in ("topics",):
            val = repo_dict.get(json_field)
            if isinstance(val, str):
                try:
                    repo_dict[json_field] = json.loads(val)
                except Exception:
                    repo_dict[json_field] = []

        matches = await run_matching(repo_dict, funding_sources)

        # 4. Save matches to DB (clear old ones first)
        db.query(Match).filter(Match.repo_id == repo_id).delete()
        for m in matches:
            db_match = Match(
                repo_id=repo_id,
                funding_id=m["funding_id"],
                match_score=m["score"],
                reasoning=m.get("reasoning", ""),
                strengths=m.get("strengths", []),
                gaps=m.get("gaps", []),
                application_tips=m.get("application_tips", ""),
            )
            db.add(db_match)

        repo.status = "analyzed"
        db.commit()

    except Exception as e:
        try:
            repo = db.query(Repo).filter(Repo.id == repo_id).first()
            if repo:
                repo.status = "error"
                repo.error_message = f"Unexpected error: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/bounties")
@limiter.limit("5/minute")
async def get_bounties(request: Request, q: str = "label:bounty label:\"help wanted\" state:open"):
    """Fetch live bounties from GitHub search."""
    bounties = await fetch_live_bounties(q)
    return {"bounties": bounties, "total": len(bounties)}


class MonetizeRequest(BaseModel):
    repo_id: str


@app.post("/api/monetize/generate")
async def generate_monetize_strategy(body: MonetizeRequest, db: Session = Depends(get_db)):
    """Generate a custom monetization strategy for a repo."""
    repo = db.query(Repo).filter(Repo.id == body.repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    
    # Build repo dict
    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    try:
        strategy = await generate_monetization_strategy(repo_dict)
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate strategy: {str(e)}")


@app.get("/api/scan")
@limiter.limit("5/minute")
async def scan_repo_get(request: Request, url: str, db: Session = Depends(get_db)):
    """
    Single GET endpoint for AI agents (web_fetch compatible).
    Submits repo, waits for analysis, returns formatted results.
    Usage: GET /api/scan?url=https://github.com/owner/repo
    """
    import uuid as _uuid

    try:
        # Validate URL strictly
        import re as _re
        url = url.strip()
        _pattern = r'^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$'
        if not _re.match(_pattern, url):
            return {"error": "Invalid GitHub URL. Format: https://github.com/owner/repo"}
        url = url.rstrip("/")

        parts = url.split("/")
        if len(parts) < 5:
            return {"error": "Invalid GitHub URL. Format: https://github.com/owner/repo"}

        owner, repo_name = parts[3], parts[4]

        # Check if already analyzed
        existing = db.query(Repo).filter(Repo.github_url == url).first()
        if existing and existing.status == "analyzed":
            repo_id = existing.id
        else:
            # Submit new or reuse pending
            if existing:
                repo_id = existing.id
            else:
                repo_id = str(_uuid.uuid4())
                new_repo = Repo(
                    id=repo_id,
                    github_url=url,
                    repo_name=repo_name,
                    owner=owner,
                    status="pending",
                )
                db.add(new_repo)
                db.commit()

            # Run analysis inline (await)
            await _analyze_and_match(repo_id)

        # Re-fetch fresh from DB
        repo = db.query(Repo).filter(Repo.id == repo_id).first()
        if not repo:
            return {"error": "Repo not found after analysis."}

        if repo.status == "error":
            return {"error": repo.error_message or "Analysis failed. Repo may be private."}

        if repo.status != "analyzed":
            return {"error": "Analysis not complete. Try again in a few seconds."}

        # Get top matches
        matches = (
            db.query(Match, FundingSource)
            .join(FundingSource, Match.funding_id == FundingSource.id)
            .filter(Match.repo_id == repo.id)
            .order_by(Match.match_score.desc())
            .limit(5)
            .all()
        )

        # Build repo dict for fundability (exclude SQLAlchemy internals)
        repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
        fundability = analyze_fundability(repo_dict)

        top_matches = []
        for m, fs in matches:
            if fs.min_amount and fs.max_amount:
                amount = f"${fs.min_amount:,}–${fs.max_amount:,}"
            elif fs.max_amount:
                amount = f"up to ${fs.max_amount:,}"
            else:
                amount = "varies"
            # match_score stored as 0-100 scale
            pct = round(m.match_score) if m.match_score > 1 else round(m.match_score * 100)
            top_matches.append({
                "funder": fs.name,
                "amount": amount,
                "match_pct": min(pct, 100),
                "type": fs.type or "",
                "url": fs.url or "",
            })

        score = fundability.get("score", 0)
        grade = fundability.get("grade", "N/A")
        potential = fundability.get("funding_potential_usd", "Unknown")
        top_funder = top_matches[0]["funder"] if top_matches else "none"
        top_pct = top_matches[0]["match_pct"] if top_matches else 0

        return {
            "repo": f"{owner}/{repo_name}",
            "stars": repo.stars,
            "forks": repo.forks,
            "language": repo.language,
            "description": repo.description,
            "fundability_score": score,
            "grade": grade,
            "funding_potential_usd": potential,
            "top_matches": top_matches,
            "dashboard_url": f"http://localhost:5173/results/{repo.id}",
            "summary": f"{owner}/{repo_name} scored {score}/100 (Grade {grade}). Top match: {top_funder} ({top_pct}% match). Potential: {potential}.",
        }

    except Exception as e:
        return {"error": f"Scan failed: {str(e)}"}


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Platform statistics for the landing page."""
    total_repos = db.query(Repo).count()
    analyzed = db.query(Repo).filter(Repo.status == "analyzed").count()
    total_funding = db.query(FundingSource).filter(FundingSource.active == True).count()
    total_matches = db.query(Match).count()
    return {
        "repos_submitted": total_repos,
        "repos_analyzed": analyzed,
        "funding_sources": total_funding,
        "matches_made": total_matches,
    }


@app.post("/api/repos/submit", status_code=202)
@limiter.limit("10/minute")
async def submit_repo(
    request: Request,
    body: RepoSubmitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Submit a GitHub repository URL for analysis.
    Returns a repo_id immediately; analysis runs in the background.
    Poll GET /api/repos/{repo_id} for status updates.
    """
    # Check if this URL was already analyzed recently (last 24h)
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    existing = (
        db.query(Repo)
        .filter(
            Repo.github_url == body.github_url,
            Repo.status == "analyzed",
            Repo.created_at >= cutoff,
        )
        .first()
    )
    if existing:
        return {
            "repo_id": existing.id,
            "status": "cached",
            "message": "This repo was recently analyzed. Returning cached results.",
        }

    # Create a new repo record (status=pending, will be updated by background task)
    # Do a quick URL parse to get repo_name early
    try:
        parts = body.github_url.rstrip("/").split("/")
        repo_name = f"{parts[-2]}/{parts[-1]}".replace(".git", "")
    except Exception:
        repo_name = body.github_url

    repo = Repo(
        github_url=body.github_url,
        repo_name=repo_name,
        status="pending",
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    # Kick off background analysis
    background_tasks.add_task(_analyze_and_match, repo.id)

    return {
        "repo_id": repo.id,
        "status": "pending",
        "message": "Analysis started. Poll /api/repos/{repo_id} for status.",
    }


@app.get("/api/repos/{repo_id}")
def get_repo(repo_id: str, db: Session = Depends(get_db)):
    """Get repo details and current analysis status."""
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")

    return {
        "id": repo.id,
        "github_url": repo.github_url,
        "repo_name": repo.repo_name,
        "owner": repo.owner,
        "stars": repo.stars,
        "forks": repo.forks,
        "language": repo.language,
        "description": repo.description,
        "topics": repo.topics or [],
        "license_name": repo.license_name,
        "contributors_count": repo.contributors_count,
        "commit_frequency": repo.commit_frequency,
        "homepage": repo.homepage,
        "status": repo.status,
        "error_message": repo.error_message,
        "created_at": repo.created_at.isoformat() if repo.created_at else None,
    }


@app.get("/api/repos/{repo_id}/matches")
def get_matches(repo_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Get AI-matched funding opportunities for a repo.
    Returns matches sorted by score descending.
    """
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")

    if repo.status == "pending":
        return {"status": "pending", "message": "Analysis in progress. Try again in a few seconds.", "matches": []}

    if repo.status == "error":
        raise HTTPException(status_code=400, detail=repo.error_message or "Analysis failed.")

    matches = (
        db.query(Match)
        .filter(Match.repo_id == repo_id)
        .order_by(Match.match_score.desc())
        .limit(limit)
        .all()
    )

    result = []
    for m in matches:
        fs = db.query(FundingSource).filter(FundingSource.id == m.funding_id).first()
        if not fs:
            continue
        result.append({
            "id": m.id,
            "repo_id": m.repo_id,
            "funding_id": m.funding_id,
            "match_score": m.match_score,
            "reasoning": m.reasoning,
            "strengths": m.strengths or [],
            "gaps": m.gaps or [],
            "application_tips": m.application_tips,
            "funding_source": {
                "id": fs.id,
                "name": fs.name,
                "type": fs.type,
                "min_amount": fs.min_amount,
                "max_amount": fs.max_amount,
                "description": fs.description,
                "url": fs.url,
                "category": fs.category,
                "tags": fs.tags or [],
                "focus_areas": fs.focus_areas or [],
                "is_recurring": fs.is_recurring,
                "deadline": fs.deadline,
                "application_required": fs.application_required,
            },
        })

    return {
        "status": "analyzed",
        "repo_id": repo_id,
        "repo_name": repo.repo_name,
        "matches": result,
        "total": len(result),
    }


@app.get("/api/funding-sources")
def list_funding_sources(
    category: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List all available funding sources.
    Optional filters: category (platform|foundation|corporate|government|crypto|nonprofit|vc)
                     type (grant|sponsorship|accelerator)
    """
    query = db.query(FundingSource).filter(FundingSource.active == True)
    if category:
        query = query.filter(FundingSource.category == category)
    if type:
        query = query.filter(FundingSource.type == type)

    sources = query.order_by(FundingSource.category, FundingSource.name).all()

    return {
        "funding_sources": [
            {
                "id": fs.id,
                "name": fs.name,
                "type": fs.type,
                "min_amount": fs.min_amount,
                "max_amount": fs.max_amount,
                "description": fs.description,
                "url": fs.url,
                "category": fs.category,
                "tags": fs.tags or [],
                "focus_areas": fs.focus_areas or [],
                "is_recurring": fs.is_recurring,
                "deadline": fs.deadline,
                "application_required": fs.application_required,
            }
            for fs in sources
        ],
        "total": len(sources),
        "categories": list({fs.category for fs in sources}),
    }


@app.post("/api/matches/details")
def get_match_details(body: MatchDetailsRequest, db: Session = Depends(get_db)):
    """Get detailed match analysis for a specific repo + funding source pair."""
    match = (
        db.query(Match)
        .filter(Match.repo_id == body.repo_id, Match.funding_id == body.funding_id)
        .first()
    )
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    fs = db.query(FundingSource).filter(FundingSource.id == body.funding_id).first()
    repo = db.query(Repo).filter(Repo.id == body.repo_id).first()

    return {
        "match": {
            "id": match.id,
            "score": match.match_score,
            "reasoning": match.reasoning,
            "strengths": match.strengths or [],
            "gaps": match.gaps or [],
            "application_tips": match.application_tips,
        },
        "funding_source": {
            "id": fs.id,
            "name": fs.name,
            "type": fs.type,
            "description": fs.description,
            "url": fs.url,
            "category": fs.category,
            "min_amount": fs.min_amount,
            "max_amount": fs.max_amount,
            "deadline": fs.deadline,
            "eligibility": fs.eligibility or {},
        } if fs else None,
        "repo": {
            "id": repo.id,
            "repo_name": repo.repo_name,
            "stars": repo.stars,
            "language": repo.language,
            "description": repo.description,
        } if repo else None,
    }


# ---------------------------------------------------------------------------
# Fundability Analysis
# ---------------------------------------------------------------------------
@app.get("/api/repos/{repo_id}/fundability")
def get_fundability(repo_id: str, db: Session = Depends(get_db)):
    """Analyze a repo's fundability score and return actionable improvement tips."""
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status == "pending":
        raise HTTPException(status_code=400, detail="Analysis still in progress.")

    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    return analyze_fundability(repo_dict)


# ---------------------------------------------------------------------------
# Grant Application Writer
# ---------------------------------------------------------------------------
class ApplicationRequest(BaseModel):
    funding_id: int


@app.post("/api/repos/{repo_id}/generate-application")
async def generate_application_endpoint(
    repo_id: str,
    body: ApplicationRequest,
    db: Session = Depends(get_db),
):
    """Generate a complete AI-written grant application for a repo + funding source pair."""
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status != "analyzed":
        raise HTTPException(status_code=400, detail="Repository analysis not complete yet.")

    fs = db.query(FundingSource).filter(FundingSource.id == body.funding_id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Funding source not found.")

    # Build repo dict
    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    # Build funding source dict
    fs_dict = {
        "id": fs.id,
        "name": fs.name,
        "type": fs.type,
        "description": fs.description,
        "url": fs.url,
        "category": fs.category,
        "tags": fs.tags or [],
        "focus_areas": fs.focus_areas or [],
        "eligibility": fs.eligibility or {},
        "min_amount": fs.min_amount,
        "max_amount": fs.max_amount,
    }

    try:
        application = await generate_application(repo_dict, fs_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Application generation failed: {str(e)}")

    return application


# ---------------------------------------------------------------------------
# README Badge
# ---------------------------------------------------------------------------
@app.get("/badge/{owner}/{repo}.svg", response_class=Response)
def get_badge(owner: str, repo: str, db: Session = Depends(get_db)):
    """Return a dynamic SVG badge showing funding match count for a GitHub repo."""
    github_url_pattern = f"github.com/{owner}/{repo}"
    repo_record = (
        db.query(Repo)
        .filter(Repo.github_url.contains(github_url_pattern), Repo.status == "analyzed")
        .order_by(Repo.created_at.desc())
        .first()
    )
    if not repo_record:
        svg = generate_badge_svg(0, 0)
    else:
        count = db.query(Match).filter(Match.repo_id == repo_record.id).count()
        top = (
            db.query(Match)
            .filter(Match.repo_id == repo_record.id)
            .order_by(Match.match_score.desc())
            .first()
        )
        svg = generate_badge_svg(count, top.match_score if top else 0)

    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Cache-Control": "max-age=3600", "Access-Control-Allow-Origin": "*"},
    )


# ---------------------------------------------------------------------------
# GitHub Org Scanner
# ---------------------------------------------------------------------------
class OrgScanRequest(BaseModel):
    org: str


# ---------------------------------------------------------------------------
# API Settings
# ---------------------------------------------------------------------------
@app.get("/api/settings")
def get_api_settings():
    """Get current LLM settings (keys masked)."""
    settings = load_settings()
    # Mask keys for security
    masked = json.loads(json.dumps(settings))
    for p in masked.get("providers", {}).values():
        if p.get("api_key"):
            p["api_key"] = p["api_key"][:4] + "*" * 10 + p["api_key"][-4:] if len(p["api_key"]) > 8 else "********"
    return masked

class SettingsUpdateRequest(BaseModel):
    provider: str
    config: Optional[dict] = None

@app.post("/api/settings")
def update_api_settings(body: SettingsUpdateRequest):
    """Update LLM provider and/or configuration."""
    settings = load_settings()
    if body.provider not in settings.get("providers", {}):
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    settings["provider"] = body.provider
    if body.config:
        # Merge config
        for k, v in body.config.items():
            if k in settings["providers"][body.provider]:
                settings["providers"][body.provider][k] = v
    
    save_settings(settings)
    return {"status": "success", "provider": body.provider}

@app.post("/api/org/scan")
async def api_scan_org(body: OrgScanRequest):
    """Scan a GitHub organization for high-impact repos."""
    try:
        results = await scan_org(body.org)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


# ---------------------------------------------------------------------------
# Dependency Funding Map
# ---------------------------------------------------------------------------
class DepsRequest(BaseModel):
    content: str        # Raw package.json or requirements.txt content
    ecosystem: str      # "npm" or "pip"


@app.post("/api/dependencies/analyze")
async def analyze_dependencies(body: DepsRequest):
    """
    Parse a package.json or requirements.txt and check each dependency's
    funding health on GitHub.
    """
    import httpx, re, json as json_mod

    ecosystem = body.ecosystem.lower()
    content   = body.content.strip()
    packages  = []

    # ── Parse package names ─────────────────────────────────────────────
    if ecosystem == "npm":
        try:
            parsed = json_mod.loads(content)
            deps   = {**parsed.get("dependencies", {}), **parsed.get("devDependencies", {})}
            packages = list(deps.keys())[:30]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid package.json")
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
        raise HTTPException(status_code=400, detail="No packages found.")

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
                        data   = r.json()
                        repo   = data.get("repository", {})
                        rawurl = repo.get("url", "") if isinstance(repo, dict) else ""
                        match  = re.search(r"github\.com[/:]([^/]+/[^/.\s]+)", rawurl)
                        if match:
                            github_url = f"https://github.com/{match.group(1).removesuffix('.git')}"
                else:
                    r = await client.get(f"https://pypi.org/pypi/{pkg}/json")
                    if r.status_code == 200:
                        info   = r.json().get("info", {})
                        urls   = info.get("project_urls") or {}
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
            stars = forks = contributors = 0
            language = license_name = ""
            commit_freq = 0.0
            has_sponsors = False

            if github_url:
                try:
                    path   = github_url.replace("https://github.com/", "")
                    r      = await client.get(f"https://api.github.com/repos/{path}", headers=gh_headers)
                    if r.status_code == 200:
                        d            = r.json()
                        stars        = d.get("stargazers_count", 0)
                        forks        = d.get("forks_count", 0)
                        language     = d.get("language", "")
                        lic          = d.get("license") or {}
                        license_name = lic.get("spdx_id", "")

                    # Check GitHub Sponsors (funding.yml)
                    fund_r = await client.get(
                        f"https://api.github.com/repos/{path}/contents/.github/FUNDING.yml",
                        headers=gh_headers,
                    )
                    has_sponsors = fund_r.status_code == 200
                except Exception:
                    pass

            # Determine risk level
            risk = "low"
            risk_reasons = []
            if stars < 100:
                risk = "high"
                risk_reasons.append(f"Only {stars} stars")
            if not has_sponsors:
                if risk != "high":
                    risk = "medium"
                risk_reasons.append("No funding setup")
            if not license_name:
                risk = "high"
                risk_reasons.append("No license")

            results.append({
                "package": pkg,
                "ecosystem": ecosystem,
                "github_url": github_url,
                "stars": stars,
                "forks": forks,
                "language": language,
                "license": license_name,
                "has_sponsors": has_sponsors,
                "risk": risk,
                "risk_reasons": risk_reasons,
            })

    # Sort: high risk first
    risk_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: risk_order.get(x["risk"], 3))

    return {
        "ecosystem": ecosystem,
        "total": len(results),
        "high_risk": sum(1 for r in results if r["risk"] == "high"),
        "medium_risk": sum(1 for r in results if r["risk"] == "medium"),
        "packages": results,
    }


# ---------------------------------------------------------------------------
# Funded DNA — compare repo to known funded OSS projects
# ---------------------------------------------------------------------------
@app.get("/api/repos/{repo_id}/dna")
def get_dna(repo_id: str, db: Session = Depends(get_db)):
    """
    Compare a repo's profile against 45+ known funded OSS projects across 6 dimensions.
    Returns top matches, DNA score, and insight about which funders back similar projects.
    """
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status == "pending":
        raise HTTPException(status_code=400, detail="Analysis still in progress.")

    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    result = compare_repo_to_funded_dna(repo_dict)
    result["repo_name"] = repo.repo_name
    result["repo_id"] = repo_id
    return result


# ---------------------------------------------------------------------------
# Portfolio Optimizer — optimal grant stack
# ---------------------------------------------------------------------------
@app.get("/api/repos/{repo_id}/portfolio")
def get_portfolio(repo_id: str, max_grants: int = 6, db: Session = Depends(get_db)):
    """
    Build an optimal grant application stack for a repo.
    Uses existing match scores to maximize total potential funding while avoiding funder conflicts.
    """
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status == "pending":
        raise HTTPException(status_code=400, detail="Analysis still in progress.")
    if repo.status != "analyzed":
        raise HTTPException(status_code=400, detail="Repository must be analyzed first. Run /api/repos/{repo_id}/matches.")

    matches = (
        db.query(Match)
        .filter(Match.repo_id == repo_id)
        .order_by(Match.match_score.desc())
        .limit(30)
        .all()
    )

    if not matches:
        raise HTTPException(status_code=404, detail="No matches found. Run AI matching first.")

    # Build match dicts
    match_dicts = []
    for m in matches:
        fs = db.query(FundingSource).filter(FundingSource.id == m.funding_id).first()
        if not fs:
            continue
        match_dicts.append({
            "funding_id": m.funding_id,
            "match_score": m.match_score,
            "reasoning": m.reasoning,
            "strengths": m.strengths or [],
            "gaps": m.gaps or [],
            "funding_source": {
                "id": fs.id,
                "name": fs.name,
                "type": fs.type,
                "min_amount": fs.min_amount,
                "max_amount": fs.max_amount,
                "description": fs.description,
                "url": fs.url,
                "category": fs.category,
            },
        })

    result = optimize_portfolio(match_dicts, max_grants=max_grants)
    result["repo_name"] = repo.repo_name
    result["repo_id"] = repo_id
    return result


# ---------------------------------------------------------------------------
# Velocity Dashboard — funding progress metrics
# ---------------------------------------------------------------------------
@app.get("/api/repos/{repo_id}/velocity")
def get_velocity(repo_id: str, db: Session = Depends(get_db)):
    """
    Calculate velocity metrics and predict when key funding milestones will be reached.
    Returns velocity score (0-100), benchmarks vs funded project averages, and predictions.
    """
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status == "pending":
        raise HTTPException(status_code=400, detail="Analysis still in progress.")

    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    result = calculate_velocity(repo_dict)
    result["repo_name"] = repo.repo_name
    result["repo_id"] = repo_id
    return result


# ---------------------------------------------------------------------------
# Time Machine — 90-day LLM funding roadmap
# ---------------------------------------------------------------------------
class RoadmapRequest(BaseModel):
    funding_ids: list[int]


@app.post("/api/repos/{repo_id}/roadmap")
async def generate_roadmap_endpoint(
    repo_id: str,
    body: RoadmapRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a precise 90-day action plan to prepare a repo for specific funding sources.
    Body: {"funding_ids": [1, 2, 3]}  — up to 5 funding source IDs.
    """
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    if repo.status != "analyzed":
        raise HTTPException(status_code=400, detail="Repository must be fully analyzed first.")

    if not body.funding_ids:
        raise HTTPException(status_code=400, detail="Provide at least one funding_id.")

    # Fetch up to 5 funding sources
    funding_sources = []
    for fid in body.funding_ids[:5]:
        fs = db.query(FundingSource).filter(FundingSource.id == fid).first()
        if fs:
            funding_sources.append({
                "id": fs.id,
                "name": fs.name,
                "type": fs.type,
                "description": fs.description,
                "category": fs.category,
                "focus_areas": fs.focus_areas or [],
                "min_amount": fs.min_amount,
                "max_amount": fs.max_amount,
                "url": fs.url,
            })

    if not funding_sources:
        raise HTTPException(status_code=404, detail="None of the specified funding sources were found.")

    # Build repo dict
    repo_dict = {c.name: getattr(repo, c.name) for c in repo.__table__.columns}
    for json_field in ("topics",):
        val = repo_dict.get(json_field)
        if isinstance(val, str):
            try:
                repo_dict[json_field] = json.loads(val)
            except Exception:
                repo_dict[json_field] = []

    try:
        result = await generate_roadmap(repo_dict, funding_sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

    return result


# ---------------------------------------------------------------------------
# GitHub Trending Spotlight
# ---------------------------------------------------------------------------
@app.get("/api/trending")
async def get_trending(
    language: str = "",
    since: str = "weekly",
):
    """
    Fetch GitHub trending repositories.
    since: daily | weekly | monthly
    language: optional language filter (e.g. "python", "javascript")
    """
    import httpx
    from datetime import timedelta

    days_map = {"daily": 1, "weekly": 7, "monthly": 30}
    days = days_map.get(since, 7)
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    q = f"created:>{cutoff} stars:>5"
    if language:
        q += f" language:{language}"

    gh_token = os.getenv("GITHUB_TOKEN", "")
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenGrant/1.0",
        **({"Authorization": f"token {gh_token}"} if gh_token else {}),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.github.com/search/repositories",
                params={"q": q, "sort": "stars", "order": "desc", "per_page": 25},
                headers=headers,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="GitHub API error.")

            data = resp.json()
            items = data.get("items", [])

            repos = []
            for r in items:
                # Fetch topics (included in response with mercy preview header)
                repos.append({
                    "id": r["id"],
                    "full_name": r["full_name"],
                    "name": r["name"],
                    "owner": r["owner"]["login"],
                    "avatar_url": r["owner"]["avatar_url"],
                    "description": r.get("description") or "",
                    "html_url": r["html_url"],
                    "stars": r["stargazers_count"],
                    "forks": r["forks_count"],
                    "language": r.get("language") or "",
                    "topics": r.get("topics") or [],
                    "license": (r.get("license") or {}).get("spdx_id") or "",
                    "created_at": r["created_at"],
                    "updated_at": r["updated_at"],
                    "open_issues": r["open_issues_count"],
                    "watchers": r["watchers_count"],
                    "homepage": r.get("homepage") or "",
                    "github_url": r["html_url"],
                })

        return {
            "repos": repos,
            "total": len(repos),
            "since": since,
            "language": language,
            "cutoff_date": cutoff,
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="GitHub API timed out.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trending fetch failed: {str(e)}")


# ---------------------------------------------------------------------------
# Leaderboard — most fundable repos on this platform
# ---------------------------------------------------------------------------
@app.get("/api/leaderboard")
def get_leaderboard(limit: int = 25, db: Session = Depends(get_db)):
    """Return repos ranked by funding match quality (top_score * match_count)."""
    repos = db.query(Repo).filter(Repo.status == "analyzed").all()

    leaderboard = []
    for repo in repos:
        matches = db.query(Match).filter(Match.repo_id == repo.id).all()
        if not matches:
            continue
        avg_score = sum(m.match_score for m in matches) / len(matches)
        top_score = max(m.match_score for m in matches)
        total_potential = 0
        for m in matches:
            fs = db.query(FundingSource).filter(FundingSource.id == m.funding_id).first()
            if fs:
                total_potential += fs.max_amount or 0
        leaderboard.append({
            "repo_id": repo.id,
            "repo_name": repo.repo_name,
            "github_url": repo.github_url,
            "stars": repo.stars or 0,
            "language": repo.language or "",
            "description": repo.description or "",
            "match_count": len(matches),
            "avg_score": round(avg_score, 1),
            "top_score": round(top_score, 1),
            "total_potential_usd": total_potential,
            "analyzed_at": repo.created_at.isoformat() if repo.created_at else "",
        })

    leaderboard.sort(key=lambda x: x["top_score"] * x["match_count"], reverse=True)
    return {
        "leaderboard": leaderboard[:limit],
        "total_repos_analyzed": len(repos),
    }


# ---------------------------------------------------------------------------
# Twitter Post Generator
# ---------------------------------------------------------------------------
@app.post("/api/twitter/generate")
async def generate_twitter_posts(body: RepoSubmissionRequest):
    """
    Generate Twitter posts from GitHub repo data.
    Extracts user info, repo stats, and generates 6 variations.
    """
    try:
        from github_twitter_generator import extract_and_generate

        result = await extract_and_generate(body.github_url)

        if result["success"]:
            return {
                "success": True,
                "user": result["user"],
                "repo": result["repo"],
                "posts": result["posts"],
                "count": len(result["posts"]),
            }
        else:
            return {"success": False, "error": result["error"]}

    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Run locally
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8765"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
