"""
Funder Voice Profiles
=====================
Style & tone profiles for 25+ major OSS funders.
Used by:
  - application_writer.py  (inject voice into generated applications)
  - funded_dna.py          (match known funded project profiles)
"""

from difflib import SequenceMatcher

FUNDER_PROFILES = {
    "NLnet Foundation": {
        "tone": "technical, precise, internet-standards focused",
        "emphasize": ["internet standards", "decentralization", "privacy", "security", "open protocols"],
        "avoid": ["commercial", "profit", "monetization", "SaaS", "startup"],
        "key_phrases": ["public benefit", "open standards", "internet freedom", "decentralized infrastructure"],
        "typical_amount_range": (5000, 50000),
        "funding_type": "grant",
    },
    "Mozilla MOSS": {
        "tone": "mission-driven, community-centric, pragmatic",
        "emphasize": ["open web", "privacy", "security", "healthy internet", "user agency"],
        "avoid": ["closed-source dependencies", "proprietary lock-in"],
        "key_phrases": ["open internet", "user empowerment", "web standards", "digital rights"],
        "typical_amount_range": (10000, 150000),
        "funding_type": "grant",
    },
    "Sovereign Tech Fund": {
        "tone": "infrastructure-first, sustainability focused, direct",
        "emphasize": ["critical digital infrastructure", "maintenance", "security hardening", "sustainability"],
        "avoid": ["new features", "growth metrics", "marketing"],
        "key_phrases": ["digital public goods", "infrastructure maintenance", "open source sustainability", "critical dependencies"],
        "typical_amount_range": (100000, 1000000),
        "funding_type": "grant",
    },
    "GitHub Sponsors": {
        "tone": "developer-friendly, personal, impact-driven",
        "emphasize": ["community impact", "developer tools", "productivity", "ecosystem contribution"],
        "avoid": ["corporate language", "jargon"],
        "key_phrases": ["open source maintainer", "community-driven", "developer ecosystem"],
        "typical_amount_range": (100, 50000),
        "funding_type": "sponsorship",
    },
    "Open Source Collective": {
        "tone": "community-governed, transparent, collective-benefit",
        "emphasize": ["community governance", "transparency", "collective ownership", "fiscal sponsorship"],
        "avoid": ["individual profit", "closed decision-making"],
        "key_phrases": ["fiscal sponsor", "open collective", "transparent finances", "community-led"],
        "typical_amount_range": (1000, 100000),
        "funding_type": "sponsorship",
    },
    "Linux Foundation": {
        "tone": "enterprise-grade, ecosystem-wide, collaborative",
        "emphasize": ["industry adoption", "neutrality", "cross-industry collaboration", "standardization"],
        "avoid": ["single-vendor", "fragmentation"],
        "key_phrases": ["vendor-neutral", "industry consortium", "enterprise adoption", "open governance"],
        "typical_amount_range": (50000, 500000),
        "funding_type": "grant",
    },
    "Apache Software Foundation": {
        "tone": "meritocratic, community-consensus, license-strict",
        "emphasize": ["Apache License", "community governance", "meritocracy", "collaborative development"],
        "avoid": ["proprietary code", "CLA concerns", "non-Apache licenses"],
        "key_phrases": ["the Apache Way", "community over code", "open collaboration", "ASF governance"],
        "typical_amount_range": (5000, 50000),
        "funding_type": "grant",
    },
    "NSF POSE": {
        "tone": "academic, impact-quantified, ecosystem-building",
        "emphasize": ["scientific impact", "research community", "ecosystem development", "broader impacts"],
        "avoid": ["purely commercial", "non-reproducible"],
        "key_phrases": ["open source ecosystem", "scientific community", "reproducible research", "NSF-funded infrastructure"],
        "typical_amount_range": (300000, 1500000),
        "funding_type": "grant",
    },
    "Google Summer of Code": {
        "tone": "mentorship-focused, structured, learning-oriented",
        "emphasize": ["student contributors", "mentorship", "code quality", "onboarding new contributors"],
        "avoid": ["maintenance-only work", "documentation-only"],
        "key_phrases": ["open source community", "student developer", "mentored contribution", "Google OSS"],
        "typical_amount_range": (1500, 6600),
        "funding_type": "grant",
    },
    "Gitcoin Grants": {
        "tone": "web3-native, public goods focused, community-validated",
        "emphasize": ["public goods", "decentralization", "web3 ecosystem", "community-funded"],
        "avoid": ["centralized control", "VC-backed"],
        "key_phrases": ["public goods funding", "quadratic funding", "web3 commons", "decentralized"],
        "typical_amount_range": (500, 50000),
        "funding_type": "grant",
    },
    "Ethereum Foundation": {
        "tone": "technical-deep, ecosystem-aware, research-quality",
        "emphasize": ["Ethereum ecosystem", "decentralization", "cryptographic security", "research quality"],
        "avoid": ["non-Ethereum chains only", "purely speculative"],
        "key_phrases": ["Ethereum ecosystem", "decentralized infrastructure", "cryptographic primitives", "EVM compatibility"],
        "typical_amount_range": (10000, 300000),
        "funding_type": "grant",
    },
    "Prototype Fund Germany": {
        "tone": "civic-tech, social-impact, German/EU ecosystem",
        "emphasize": ["civic technology", "digital sovereignty", "social impact", "German/EU public benefit"],
        "avoid": ["purely commercial", "non-EU focus"],
        "key_phrases": ["civic tech", "public interest", "digital sovereignty", "Bundesministerium"],
        "typical_amount_range": (10000, 47500),
        "funding_type": "grant",
    },
    "CNCF": {
        "tone": "cloud-native, production-grade, ecosystem-integrated",
        "emphasize": ["cloud native", "Kubernetes ecosystem", "production readiness", "horizontal scalability"],
        "avoid": ["monolithic architecture", "vendor lock-in"],
        "key_phrases": ["cloud native computing", "Kubernetes", "container orchestration", "microservices"],
        "typical_amount_range": (10000, 200000),
        "funding_type": "grant",
    },
    "Sloan Foundation": {
        "tone": "scientific-rigor, economic-impact, data-driven",
        "emphasize": ["scientific infrastructure", "economic impact", "research community", "reproducibility"],
        "avoid": ["speculative", "poorly-evidenced"],
        "key_phrases": ["scientific software", "research infrastructure", "computational science", "open data"],
        "typical_amount_range": (50000, 500000),
        "funding_type": "grant",
    },
    "Chan Zuckerberg Initiative": {
        "tone": "science-forward, collaborative, large-scale-impact",
        "emphasize": ["biomedical research", "scientific collaboration", "open science", "large-scale impact"],
        "avoid": ["narrow focus", "single-institution"],
        "key_phrases": ["open science", "biomedical research", "scientific community", "collaborative infrastructure"],
        "typical_amount_range": (50000, 2000000),
        "funding_type": "grant",
    },
    "Open Technology Fund": {
        "tone": "human-rights-aligned, censorship-resistant, security-hardened",
        "emphasize": ["internet freedom", "censorship circumvention", "human rights", "security"],
        "avoid": ["proprietary", "surveillance-enabling"],
        "key_phrases": ["internet freedom", "censorship circumvention", "human rights technology", "digital rights"],
        "typical_amount_range": (10000, 900000),
        "funding_type": "grant",
    },
    "Python Software Foundation": {
        "tone": "Python-ecosystem, community-steward, accessible",
        "emphasize": ["Python ecosystem", "community diversity", "education", "accessibility"],
        "avoid": ["non-Python", "exclusionary"],
        "key_phrases": ["Python community", "PSF mission", "open source Python", "inclusive community"],
        "typical_amount_range": (1000, 30000),
        "funding_type": "grant",
    },
    "Rust Foundation": {
        "tone": "systems-programming, safety-focused, performance-oriented",
        "emphasize": ["memory safety", "systems programming", "Rust ecosystem", "performance"],
        "avoid": ["garbage-collected languages only", "unsafe practices"],
        "key_phrases": ["Rust ecosystem", "memory safety", "zero-cost abstractions", "systems programming"],
        "typical_amount_range": (5000, 100000),
        "funding_type": "grant",
    },
    "EU Horizon / NGI": {
        "tone": "policy-compliant, European-values, measurable-KPIs",
        "emphasize": ["European digital sovereignty", "next-generation internet", "privacy by design", "open standards"],
        "avoid": ["non-EU beneficiaries primarily", "proprietary"],
        "key_phrases": ["European digital infrastructure", "NGI initiative", "open internet", "digital sovereignty"],
        "typical_amount_range": (50000, 3000000),
        "funding_type": "grant",
    },
    "Filecoin Foundation": {
        "tone": "decentralized-storage, web3, cryptographic",
        "emphasize": ["decentralized storage", "IPFS", "content addressing", "web3 infrastructure"],
        "avoid": ["centralized storage", "single point of failure"],
        "key_phrases": ["decentralized storage", "IPFS ecosystem", "content-addressed data", "web3 infrastructure"],
        "typical_amount_range": (5000, 200000),
        "funding_type": "grant",
    },
    "Hedera HBAR Foundation": {
        "tone": "enterprise-blockchain, sustainable, governance-aligned",
        "emphasize": ["Hedera network", "enterprise adoption", "sustainability", "governance"],
        "avoid": ["non-Hedera chains"],
        "key_phrases": ["Hedera ecosystem", "enterprise blockchain", "hashgraph", "sustainable blockchain"],
        "typical_amount_range": (10000, 500000),
        "funding_type": "grant",
    },
    "DARPA / DoD": {
        "tone": "dual-use, technical-depth, national-interest",
        "emphasize": ["national security applications", "technical innovation", "dual-use technology", "system robustness"],
        "avoid": ["purely academic", "no clear defense application"],
        "key_phrases": ["defense technology", "national security", "technical innovation", "system resilience"],
        "typical_amount_range": (100000, 10000000),
        "funding_type": "grant",
    },
    "Ford Foundation": {
        "tone": "equity-focused, systemic-change, grassroots-centered",
        "emphasize": ["social justice", "equity", "systemic change", "marginalized communities"],
        "avoid": ["elite-only access", "corporate-first"],
        "key_phrases": ["social justice", "equity and inclusion", "systemic change", "public interest technology"],
        "typical_amount_range": (100000, 2000000),
        "funding_type": "grant",
    },
    "Open Source Initiative": {
        "tone": "license-strict, advocacy-driven, OSS-principled",
        "emphasize": ["OSI-approved licenses", "open source principles", "community stewardship", "license compliance"],
        "avoid": ["non-OSI-approved licenses", "source-available but not open"],
        "key_phrases": ["open source definition", "OSI-approved license", "open source advocacy", "software freedom"],
        "typical_amount_range": (2000, 20000),
        "funding_type": "grant",
    },
    "Wellcome Trust": {
        "tone": "science-driven, global-health, rigorous",
        "emphasize": ["global health", "biomedical research", "data sharing", "open science"],
        "avoid": ["non-health domains", "closed data"],
        "key_phrases": ["global health", "biomedical data", "open research", "health equity"],
        "typical_amount_range": (100000, 5000000),
        "funding_type": "grant",
    },
}


def get_profile(funder_name: str) -> dict | None:
    """
    Get a funder's voice profile by name.
    Uses fuzzy matching so 'NLnet' matches 'NLnet Foundation'.
    Returns None if no reasonable match found (threshold < 0.4).
    """
    if not funder_name:
        return None

    funder_name_lower = funder_name.lower()

    # Exact match first
    if funder_name in FUNDER_PROFILES:
        return FUNDER_PROFILES[funder_name]

    # Case-insensitive substring match
    for key in FUNDER_PROFILES:
        if funder_name_lower in key.lower() or key.lower() in funder_name_lower:
            return FUNDER_PROFILES[key]

    # Fuzzy match as fallback
    best_ratio = 0.0
    best_key = None
    for key in FUNDER_PROFILES:
        ratio = SequenceMatcher(None, funder_name_lower, key.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_key = key

    if best_ratio >= 0.55 and best_key:
        return FUNDER_PROFILES[best_key]

    return None


def get_all_profile_names() -> list[str]:
    """Return all funder names that have profiles."""
    return list(FUNDER_PROFILES.keys())
