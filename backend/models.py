"""
Database models for Open Source Fund Matcher.
Uses SQLAlchemy ORM with SQLite (swappable to PostgreSQL for production).
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer, Float,
    DateTime, Text, Boolean, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fund_matcher.db")

# SQLite needs special connect_args for async safety
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes - yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Safe to call on every startup."""
    Base.metadata.create_all(bind=engine)


class Repo(Base):
    """GitHub repository submitted by a user."""
    __tablename__ = "repos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    github_url = Column(String, nullable=False, index=True)
    repo_name = Column(String, nullable=False)          # e.g. "owner/repo"
    owner = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    watchers = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    language = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    topics = Column(JSON, default=list)                 # GitHub topics/tags
    readme_excerpt = Column(Text, nullable=True)        # First 2000 chars of README
    license_name = Column(String, nullable=True)
    created_at_github = Column(DateTime, nullable=True)
    updated_at_github = Column(DateTime, nullable=True)
    homepage = Column(String, nullable=True)
    is_fork = Column(Boolean, default=False)
    has_wiki = Column(Boolean, default=False)
    has_pages = Column(Boolean, default=False)
    contributors_count = Column(Integer, default=0)
    commit_frequency = Column(Float, default=0.0)       # commits per week (avg)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")          # pending | analyzed | error
    error_message = Column(Text, nullable=True)


class FundingSource(Base):
    """A funding opportunity (grant, program, sponsor platform, etc.)."""
    __tablename__ = "funding_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False)               # grant | sponsorship | accelerator | prize | bounty
    min_amount = Column(Integer, default=0)             # USD
    max_amount = Column(Integer, default=0)             # USD (0 = variable/unlimited)
    description = Column(Text, nullable=False)
    url = Column(String, nullable=False)
    category = Column(String, nullable=False)           # platform | foundation | corporate | government | crypto | nonprofit | vc
    tags = Column(JSON, default=list)                   # searchable tags
    eligibility = Column(JSON, default=dict)            # eligibility criteria
    focus_areas = Column(JSON, default=list)            # AI, security, infra, web, etc.
    is_recurring = Column(Boolean, default=False)       # one-time vs recurring
    application_required = Column(Boolean, default=True)
    deadline = Column(String, nullable=True)            # "Rolling" or specific date
    active = Column(Boolean, default=True)


class Match(Base):
    """AI-generated match between a repo and a funding source."""
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    repo_id = Column(String, nullable=False, index=True)
    funding_id = Column(Integer, nullable=False, index=True)
    match_score = Column(Float, nullable=False)         # 0-100
    reasoning = Column(Text, nullable=False)            # Why this is a good match
    strengths = Column(JSON, default=list)              # Bullet points: what makes it a match
    gaps = Column(JSON, default=list)                   # What the project might be missing
    application_tips = Column(Text, nullable=True)      # How to strengthen the application
    created_at = Column(DateTime, default=datetime.utcnow)
