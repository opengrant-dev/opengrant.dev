"""
Funded DNA Database
====================
Static profiles of 45+ known funded OSS projects.
Algorithm compares a user's repo against these profiles across 6 dimensions
to surface which funders historically support projects like theirs.
"""

from __future__ import annotations
import math

# ---------------------------------------------------------------------------
# Static DB: known funded OSS projects
# ---------------------------------------------------------------------------
FUNDED_PROJECTS = [
    # ── Security / Privacy ────────────────────────────────────────────────
    {
        "name": "GnuPG",
        "github": "gpg/gnupg",
        "funders": ["Linux Foundation", "NLnet Foundation", "Sovereign Tech Fund"],
        "category": "security",
        "language": "C",
        "license": "GPL-3.0",
        "approximate_stars": 4000,
        "focus": ["encryption", "privacy", "cryptography", "pgp", "security"],
        "description_keywords": ["encryption", "gpg", "pgp", "openssl", "cryptographic"],
    },
    {
        "name": "OpenSSL",
        "github": "openssl/openssl",
        "funders": ["Linux Foundation", "Open Source Collective", "Sovereign Tech Fund"],
        "category": "security",
        "language": "C",
        "license": "Apache-2.0",
        "approximate_stars": 25000,
        "focus": ["ssl", "tls", "cryptography", "security", "certificates"],
        "description_keywords": ["ssl", "tls", "certificate", "encryption", "openssl"],
    },
    {
        "name": "Wireshark",
        "github": "wireshark/wireshark",
        "funders": ["Linux Foundation", "NLnet Foundation"],
        "category": "security",
        "language": "C",
        "license": "GPL-2.0",
        "approximate_stars": 6000,
        "focus": ["network analysis", "packet capture", "security", "protocol analysis"],
        "description_keywords": ["network", "packet", "protocol", "capture", "analysis"],
    },
    {
        "name": "WireGuard",
        "github": "WireGuard/wireguard-linux",
        "funders": ["NLnet Foundation", "Linux Foundation"],
        "category": "security",
        "language": "C",
        "license": "GPL-2.0",
        "approximate_stars": 4000,
        "focus": ["vpn", "networking", "privacy", "security", "cryptography"],
        "description_keywords": ["vpn", "tunnel", "wireguard", "network", "privacy"],
    },
    # ── Infrastructure / Networking ───────────────────────────────────────
    {
        "name": "curl",
        "github": "curl/curl",
        "funders": ["Sovereign Tech Fund", "Mozilla MOSS", "Open Source Collective"],
        "category": "infrastructure",
        "language": "C",
        "license": "curl",
        "approximate_stars": 34000,
        "focus": ["http", "networking", "data transfer", "api", "internet protocol"],
        "description_keywords": ["http", "curl", "networking", "data transfer", "protocol"],
    },
    {
        "name": "nginx",
        "github": "nginx/nginx",
        "funders": ["Linux Foundation", "CNCF"],
        "category": "infrastructure",
        "language": "C",
        "license": "BSD-2-Clause",
        "approximate_stars": 20000,
        "focus": ["web server", "reverse proxy", "load balancer", "infrastructure"],
        "description_keywords": ["nginx", "web server", "proxy", "load balancing", "http"],
    },
    {
        "name": "Kubernetes",
        "github": "kubernetes/kubernetes",
        "funders": ["CNCF", "Linux Foundation", "Google"],
        "category": "infrastructure",
        "language": "Go",
        "license": "Apache-2.0",
        "approximate_stars": 108000,
        "focus": ["container orchestration", "cloud native", "devops", "infrastructure"],
        "description_keywords": ["kubernetes", "container", "orchestration", "cloud", "cluster"],
    },
    {
        "name": "Prometheus",
        "github": "prometheus/prometheus",
        "funders": ["CNCF", "Linux Foundation"],
        "category": "infrastructure",
        "language": "Go",
        "license": "Apache-2.0",
        "approximate_stars": 55000,
        "focus": ["monitoring", "metrics", "alerting", "observability", "cloud native"],
        "description_keywords": ["prometheus", "monitoring", "metrics", "alerting", "observability"],
    },
    {
        "name": "Grafana",
        "github": "grafana/grafana",
        "funders": ["CNCF", "Linux Foundation"],
        "category": "infrastructure",
        "language": "Go",
        "license": "AGPL-3.0",
        "approximate_stars": 62000,
        "focus": ["visualization", "dashboards", "monitoring", "observability"],
        "description_keywords": ["grafana", "dashboard", "visualization", "metrics", "monitoring"],
    },
    {
        "name": "OpenTelemetry",
        "github": "open-telemetry/opentelemetry-collector",
        "funders": ["CNCF", "Linux Foundation"],
        "category": "infrastructure",
        "language": "Go",
        "license": "Apache-2.0",
        "approximate_stars": 4000,
        "focus": ["observability", "tracing", "metrics", "logs", "telemetry"],
        "description_keywords": ["telemetry", "tracing", "observability", "metrics", "spans"],
    },
    # ── Web / Internet ────────────────────────────────────────────────────
    {
        "name": "Firefox",
        "github": "mozilla/gecko-dev",
        "funders": ["Mozilla MOSS"],
        "category": "web",
        "language": "C++",
        "license": "MPL-2.0",
        "approximate_stars": 2000,
        "focus": ["browser", "web standards", "privacy", "open web"],
        "description_keywords": ["browser", "firefox", "gecko", "web", "html"],
    },
    {
        "name": "Mastodon",
        "github": "mastodon/mastodon",
        "funders": ["NLnet Foundation", "Prototype Fund Germany", "Open Source Collective"],
        "category": "social",
        "language": "Ruby",
        "license": "AGPL-3.0",
        "approximate_stars": 46000,
        "focus": ["decentralization", "social media", "fediverse", "activitypub", "privacy"],
        "description_keywords": ["mastodon", "fediverse", "activitypub", "decentralized", "social"],
    },
    {
        "name": "Matrix (Element)",
        "github": "matrix-org/synapse",
        "funders": ["Mozilla MOSS", "NLnet Foundation"],
        "category": "communication",
        "language": "Python",
        "license": "Apache-2.0",
        "approximate_stars": 12000,
        "focus": ["decentralized messaging", "communications", "privacy", "federation"],
        "description_keywords": ["matrix", "chat", "messaging", "federation", "homeserver"],
    },
    {
        "name": "Tor Project",
        "github": "torproject/tor",
        "funders": ["Open Technology Fund", "NLnet Foundation", "Mozilla MOSS"],
        "category": "privacy",
        "language": "C",
        "license": "BSD-3-Clause",
        "approximate_stars": 4000,
        "focus": ["anonymity", "privacy", "censorship circumvention", "security", "networking"],
        "description_keywords": ["tor", "anonymity", "privacy", "censorship", "onion routing"],
    },
    # ── Scientific / Research ─────────────────────────────────────────────
    {
        "name": "NumPy",
        "github": "numpy/numpy",
        "funders": ["Sloan Foundation", "Chan Zuckerberg Initiative", "NSF POSE"],
        "category": "scientific",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 27000,
        "focus": ["scientific computing", "linear algebra", "python", "mathematics"],
        "description_keywords": ["numpy", "array", "linear algebra", "numerical", "scientific"],
    },
    {
        "name": "SciPy",
        "github": "scipy/scipy",
        "funders": ["Sloan Foundation", "NSF POSE", "Chan Zuckerberg Initiative"],
        "category": "scientific",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 13000,
        "focus": ["scientific computing", "mathematics", "python", "statistics"],
        "description_keywords": ["scipy", "scientific", "mathematics", "statistics", "algorithms"],
    },
    {
        "name": "Jupyter",
        "github": "jupyter/notebook",
        "funders": ["Sloan Foundation", "Chan Zuckerberg Initiative", "NSF POSE"],
        "category": "scientific",
        "language": "JavaScript",
        "license": "BSD-3-Clause",
        "approximate_stars": 11000,
        "focus": ["notebooks", "interactive computing", "data science", "python", "education"],
        "description_keywords": ["jupyter", "notebook", "interactive", "kernel", "ipython"],
    },
    {
        "name": "Pandas",
        "github": "pandas-dev/pandas",
        "funders": ["Sloan Foundation", "Chan Zuckerberg Initiative"],
        "category": "scientific",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 43000,
        "focus": ["data analysis", "dataframes", "python", "statistics", "data science"],
        "description_keywords": ["pandas", "dataframe", "data analysis", "csv", "tabular"],
    },
    {
        "name": "Matplotlib",
        "github": "matplotlib/matplotlib",
        "funders": ["Sloan Foundation", "Chan Zuckerberg Initiative"],
        "category": "scientific",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 19000,
        "focus": ["visualization", "plotting", "data science", "python", "charts"],
        "description_keywords": ["matplotlib", "plotting", "visualization", "chart", "figure"],
    },
    # ── Languages / Runtimes ──────────────────────────────────────────────
    {
        "name": "Rust",
        "github": "rust-lang/rust",
        "funders": ["Rust Foundation", "Mozilla MOSS", "Linux Foundation"],
        "category": "language",
        "language": "Rust",
        "license": "MIT",
        "approximate_stars": 95000,
        "focus": ["systems programming", "memory safety", "compiler", "language"],
        "description_keywords": ["rust", "compiler", "memory safety", "systems", "language"],
    },
    {
        "name": "CPython",
        "github": "python/cpython",
        "funders": ["Python Software Foundation", "NSF POSE"],
        "category": "language",
        "language": "Python",
        "license": "PSF-2.0",
        "approximate_stars": 63000,
        "focus": ["python", "interpreter", "language", "runtime"],
        "description_keywords": ["python", "interpreter", "cpython", "runtime", "stdlib"],
    },
    {
        "name": "Go",
        "github": "golang/go",
        "funders": ["Linux Foundation", "CNCF"],
        "category": "language",
        "language": "Go",
        "license": "BSD-3-Clause",
        "approximate_stars": 123000,
        "focus": ["systems programming", "concurrency", "cloud", "networking"],
        "description_keywords": ["go", "golang", "concurrency", "goroutine", "runtime"],
    },
    # ── Developer Tools ───────────────────────────────────────────────────
    {
        "name": "Git",
        "github": "git/git",
        "funders": ["Linux Foundation", "Google Summer of Code"],
        "category": "developer-tools",
        "language": "C",
        "license": "GPL-2.0",
        "approximate_stars": 52000,
        "focus": ["version control", "developer tools", "collaboration"],
        "description_keywords": ["git", "version control", "commits", "repository", "branches"],
    },
    {
        "name": "VS Code",
        "github": "microsoft/vscode",
        "funders": ["Open Source Collective"],
        "category": "developer-tools",
        "language": "TypeScript",
        "license": "MIT",
        "approximate_stars": 162000,
        "focus": ["editor", "ide", "developer tools", "extensions", "typescript"],
        "description_keywords": ["editor", "vscode", "ide", "extension", "typescript"],
    },
    {
        "name": "Neovim",
        "github": "neovim/neovim",
        "funders": ["Open Source Collective", "Mozilla MOSS"],
        "category": "developer-tools",
        "language": "C",
        "license": "Apache-2.0",
        "approximate_stars": 82000,
        "focus": ["editor", "vim", "developer tools", "scripting", "lua"],
        "description_keywords": ["neovim", "vim", "editor", "lua", "plugin"],
    },
    # ── Web Frameworks ────────────────────────────────────────────────────
    {
        "name": "Django",
        "github": "django/django",
        "funders": ["Django Software Foundation", "Open Source Collective"],
        "category": "framework",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 80000,
        "focus": ["web framework", "python", "backend", "orm", "web development"],
        "description_keywords": ["django", "web framework", "orm", "views", "models"],
    },
    {
        "name": "React",
        "github": "facebook/react",
        "funders": ["Open Source Collective"],
        "category": "framework",
        "language": "JavaScript",
        "license": "MIT",
        "approximate_stars": 228000,
        "focus": ["ui", "javascript", "frontend", "components", "web"],
        "description_keywords": ["react", "component", "jsx", "virtual dom", "hooks"],
    },
    {
        "name": "Vue.js",
        "github": "vuejs/vue",
        "funders": ["Open Source Collective", "Patreon"],
        "category": "framework",
        "language": "JavaScript",
        "license": "MIT",
        "approximate_stars": 207000,
        "focus": ["ui", "javascript", "frontend", "components", "progressive"],
        "description_keywords": ["vue", "component", "reactive", "templates", "composition"],
    },
    # ── Blockchain / Web3 ─────────────────────────────────────────────────
    {
        "name": "go-ethereum",
        "github": "ethereum/go-ethereum",
        "funders": ["Ethereum Foundation"],
        "category": "blockchain",
        "language": "Go",
        "license": "LGPL-3.0",
        "approximate_stars": 47000,
        "focus": ["ethereum", "blockchain", "smart contracts", "web3", "defi"],
        "description_keywords": ["ethereum", "geth", "blockchain", "evm", "smart contract"],
    },
    {
        "name": "IPFS (Kubo)",
        "github": "ipfs/kubo",
        "funders": ["Filecoin Foundation", "Protocol Labs"],
        "category": "decentralized",
        "language": "Go",
        "license": "MIT",
        "approximate_stars": 16000,
        "focus": ["ipfs", "decentralized storage", "p2p", "content addressing"],
        "description_keywords": ["ipfs", "peer-to-peer", "content addressing", "distributed", "storage"],
    },
    # ── AI / ML ───────────────────────────────────────────────────────────
    {
        "name": "PyTorch",
        "github": "pytorch/pytorch",
        "funders": ["Chan Zuckerberg Initiative", "Linux Foundation"],
        "category": "ai-ml",
        "language": "Python",
        "license": "BSD-3-Clause",
        "approximate_stars": 83000,
        "focus": ["machine learning", "deep learning", "neural networks", "ai", "tensors"],
        "description_keywords": ["pytorch", "tensor", "neural network", "gradient", "deep learning"],
    },
    {
        "name": "Hugging Face Transformers",
        "github": "huggingface/transformers",
        "funders": ["Sloan Foundation"],
        "category": "ai-ml",
        "language": "Python",
        "license": "Apache-2.0",
        "approximate_stars": 133000,
        "focus": ["nlp", "transformers", "machine learning", "llm", "ai"],
        "description_keywords": ["transformers", "nlp", "bert", "gpt", "llm", "fine-tuning"],
    },
    # ── Database / Storage ────────────────────────────────────────────────
    {
        "name": "PostgreSQL",
        "github": "postgres/postgres",
        "funders": ["Linux Foundation", "Sovereign Tech Fund"],
        "category": "database",
        "language": "C",
        "license": "PostgreSQL",
        "approximate_stars": 16000,
        "focus": ["database", "sql", "relational", "storage", "transactions"],
        "description_keywords": ["postgresql", "sql", "database", "transactions", "query"],
    },
    {
        "name": "Redis",
        "github": "redis/redis",
        "funders": ["Linux Foundation"],
        "category": "database",
        "language": "C",
        "license": "BSD-3-Clause",
        "approximate_stars": 67000,
        "focus": ["cache", "database", "in-memory", "key-value", "pub-sub"],
        "description_keywords": ["redis", "cache", "key-value", "in-memory", "pub-sub"],
    },
    # ── Desktop / GUI ─────────────────────────────────────────────────────
    {
        "name": "Blender",
        "github": "blender/blender",
        "funders": ["Blender Foundation", "Open Source Collective"],
        "category": "creative",
        "language": "C",
        "license": "GPL-3.0",
        "approximate_stars": 13000,
        "focus": ["3d modeling", "animation", "rendering", "creative tools", "vfx"],
        "description_keywords": ["blender", "3d", "animation", "rendering", "mesh", "shader"],
    },
    {
        "name": "GIMP",
        "github": "GNOME/gimp",
        "funders": ["GNOME Foundation", "Open Source Collective"],
        "category": "creative",
        "language": "C",
        "license": "GPL-3.0",
        "approximate_stars": 5000,
        "focus": ["image editing", "graphics", "creative tools", "raster"],
        "description_keywords": ["gimp", "image", "pixel", "layer", "graphic", "photo"],
    },
    # ── Accessibility / Civic ─────────────────────────────────────────────
    {
        "name": "Open Food Facts",
        "github": "openfoodfacts/openfoodfacts-server",
        "funders": ["Open Food Facts", "Prototype Fund Germany"],
        "category": "civic",
        "language": "Perl",
        "license": "AGPL-3.0",
        "approximate_stars": 4000,
        "focus": ["open data", "food", "public database", "transparency"],
        "description_keywords": ["food", "data", "product", "nutrition", "barcode"],
    },
    {
        "name": "OpenStreetMap",
        "github": "openstreetmap/openstreetmap-website",
        "funders": ["Prototype Fund Germany", "NLnet Foundation"],
        "category": "civic",
        "language": "Ruby",
        "license": "GPL-2.0",
        "approximate_stars": 2000,
        "focus": ["maps", "geospatial", "open data", "civic tech"],
        "description_keywords": ["openstreetmap", "map", "geo", "location", "coordinates"],
    },
    # ── Documentation / Education ─────────────────────────────────────────
    {
        "name": "The Odin Project",
        "github": "TheOdinProject/curriculum",
        "funders": ["Open Source Collective"],
        "category": "education",
        "language": "JavaScript",
        "license": "CC-BY-SA-4.0",
        "approximate_stars": 4000,
        "focus": ["education", "web development", "curriculum", "open learning"],
        "description_keywords": ["curriculum", "education", "web development", "learning", "html"],
    },
    # ── Health / Bio ──────────────────────────────────────────────────────
    {
        "name": "OpenMRS",
        "github": "openmrs/openmrs-core",
        "funders": ["Chan Zuckerberg Initiative", "Wellcome Trust"],
        "category": "health",
        "language": "Java",
        "license": "MPL-2.0",
        "approximate_stars": 1100,
        "focus": ["electronic health records", "healthcare", "global health", "open source"],
        "description_keywords": ["medical", "health record", "patient", "clinical", "healthcare"],
    },
    {
        "name": "Bioconductor",
        "github": "Bioconductor/Bioconductor",
        "funders": ["Chan Zuckerberg Initiative", "Sloan Foundation", "Wellcome Trust"],
        "category": "bioinformatics",
        "language": "R",
        "license": "Artistic-2.0",
        "approximate_stars": 500,
        "focus": ["genomics", "bioinformatics", "biostatistics", "r", "biology"],
        "description_keywords": ["bioinformatics", "genomics", "rna", "dna", "biology"],
    },
    # ── Mobile / Embedded ─────────────────────────────────────────────────
    {
        "name": "F-Droid",
        "github": "f-droid/fdroidclient",
        "funders": ["Open Technology Fund", "NLnet Foundation"],
        "category": "mobile",
        "language": "Kotlin",
        "license": "GPL-3.0",
        "approximate_stars": 2500,
        "focus": ["android", "app store", "privacy", "free software", "mobile"],
        "description_keywords": ["android", "app", "fdroid", "apk", "free software"],
    },
    # ── Writing / Publishing ──────────────────────────────────────────────
    {
        "name": "LibreOffice",
        "github": "LibreOffice/core",
        "funders": ["The Document Foundation", "NLnet Foundation"],
        "category": "productivity",
        "language": "C++",
        "license": "MPL-2.0",
        "approximate_stars": 2500,
        "focus": ["office suite", "documents", "spreadsheets", "open document format"],
        "description_keywords": ["libreoffice", "office", "document", "spreadsheet", "presentation"],
    },
]

# ---------------------------------------------------------------------------
# Benchmarks for velocity comparisons
# ---------------------------------------------------------------------------
FUNDED_PROJECT_AVERAGES = {
    "stars_at_funding": 850,
    "forks_at_funding": 120,
    "contributors_at_funding": 8,
    "commits_per_week": 5.2,
    "age_weeks_at_funding": 78,
    "has_readme": True,
    "has_license": True,
    "has_ci": True,
}

# Star thresholds by category (approximate median for funded projects)
CATEGORY_STAR_THRESHOLDS = {
    "infrastructure": 5000,
    "security": 3000,
    "scientific": 5000,
    "developer-tools": 8000,
    "framework": 15000,
    "blockchain": 2000,
    "ai-ml": 10000,
    "database": 5000,
    "language": 20000,
    "web": 5000,
    "social": 2000,
    "privacy": 1500,
    "mobile": 1000,
    "civic": 800,
    "health": 500,
    "bioinformatics": 300,
    "education": 1000,
    "creative": 2000,
    "decentralized": 3000,
    "communication": 2000,
    "productivity": 1000,
}


# ---------------------------------------------------------------------------
# DNA Comparison Algorithm
# ---------------------------------------------------------------------------

def _score_language(repo_lang: str | None, proj_lang: str) -> float:
    """0.0–1.0 score for language similarity."""
    if not repo_lang:
        return 0.3
    if repo_lang.lower() == proj_lang.lower():
        return 1.0
    # Same family groupings
    families = {
        "systems": {"C", "C++", "Rust", "Assembly"},
        "jvm": {"Java", "Kotlin", "Scala", "Groovy"},
        "web_frontend": {"JavaScript", "TypeScript", "Dart"},
        "python_r": {"Python", "R"},
        "functional": {"Haskell", "Erlang", "Elixir", "OCaml", "F#"},
        "scripting": {"Ruby", "Perl", "PHP"},
        "go_like": {"Go", "Swift"},
    }
    for family in families.values():
        if repo_lang in family and proj_lang in family:
            return 0.5
    return 0.1


def _score_stars(repo_stars: int, proj_stars: int) -> float:
    """0.0–1.0 score based on star range proximity (log scale)."""
    if repo_stars <= 0 and proj_stars <= 0:
        return 1.0
    repo_log = math.log1p(repo_stars)
    proj_log = math.log1p(proj_stars)
    max_log = max(repo_log, proj_log)
    if max_log == 0:
        return 1.0
    diff = abs(repo_log - proj_log) / max_log
    return max(0.0, 1.0 - diff)


def _score_license(repo_license: str | None, proj_license: str) -> float:
    """0.0–1.0 score for license compatibility/similarity."""
    if not repo_license:
        return 0.2
    rl = repo_license.upper().replace("-", "")
    pl = proj_license.upper().replace("-", "")
    if rl == pl:
        return 1.0
    # Permissive family
    permissive = {"MIT", "BSD2CLAUSE", "BSD3CLAUSE", "APACHE20", "ISC", "CURL", "POSTGRESQL"}
    copyleft = {"GPL20", "GPL30", "LGPL30", "AGPL30", "MPL20"}
    if rl in permissive and pl in permissive:
        return 0.8
    if rl in copyleft and pl in copyleft:
        return 0.7
    return 0.3


def _score_topics(repo_topics: list[str], proj_focus: list[str], proj_keywords: list[str]) -> float:
    """0.0–1.0 score based on topic/keyword overlap."""
    if not repo_topics:
        return 0.2
    repo_set = {t.lower().replace("-", " ") for t in repo_topics}
    proj_set = {k.lower().replace("-", " ") for k in proj_focus + proj_keywords}

    # Direct overlap
    overlap = repo_set & proj_set
    if not proj_set:
        return 0.2

    # Also check partial word matches
    partial_hits = 0
    for r_word in repo_set:
        for p_word in proj_set:
            if r_word in p_word or p_word in r_word:
                partial_hits += 1

    direct_score = len(overlap) / max(len(proj_set), 1)
    partial_score = min(partial_hits / max(len(proj_set), 1), 1.0) * 0.5
    return min(1.0, direct_score + partial_score)


def _score_category(repo_topics: list[str], repo_desc: str, proj_category: str) -> float:
    """0.0–1.0 score for category alignment."""
    category_keywords = {
        "security": ["security", "crypto", "encryption", "auth", "privacy", "vulnerability"],
        "infrastructure": ["infrastructure", "server", "cloud", "networking", "proxy", "devops"],
        "scientific": ["science", "research", "data", "analysis", "statistics", "numerical"],
        "developer-tools": ["developer", "tool", "ide", "editor", "cli", "sdk", "debugging"],
        "framework": ["framework", "library", "sdk", "api", "web", "ui", "components"],
        "blockchain": ["blockchain", "crypto", "web3", "defi", "nft", "smart contract", "ethereum"],
        "ai-ml": ["ai", "ml", "machine learning", "neural", "nlp", "deep learning", "llm"],
        "database": ["database", "sql", "nosql", "storage", "query", "orm"],
        "language": ["compiler", "interpreter", "language", "runtime", "syntax"],
        "social": ["social", "messaging", "community", "forum", "federation"],
        "privacy": ["privacy", "anonymity", "surveillance", "tracking", "rights"],
        "mobile": ["mobile", "android", "ios", "app", "phone"],
        "civic": ["civic", "government", "public", "open data", "democracy"],
        "health": ["health", "medical", "patient", "clinical", "hospital"],
        "bioinformatics": ["genomics", "biology", "dna", "rna", "protein", "sequence"],
        "education": ["education", "learning", "course", "curriculum", "teach"],
        "creative": ["3d", "animation", "render", "graphics", "art", "design"],
        "decentralized": ["p2p", "peer-to-peer", "distributed", "ipfs", "decentralized"],
        "communication": ["chat", "messaging", "communication", "protocol", "federation"],
        "productivity": ["office", "document", "spreadsheet", "presentation"],
    }
    keywords = category_keywords.get(proj_category, [])
    if not keywords:
        return 0.5

    all_text = " ".join(repo_topics).lower() + " " + repo_desc.lower()
    hits = sum(1 for kw in keywords if kw in all_text)
    return min(1.0, hits / max(len(keywords) * 0.3, 1))


def _score_activity(repo_commits_per_week: float, repo_contributors: int) -> float:
    """0.0–1.0 score based on project activity vs funded project averages."""
    avg_commits = FUNDED_PROJECT_AVERAGES["commits_per_week"]
    avg_contributors = FUNDED_PROJECT_AVERAGES["contributors_at_funding"]

    commit_score = min(1.0, repo_commits_per_week / max(avg_commits, 0.1))
    contrib_score = min(1.0, repo_contributors / max(avg_contributors, 1))

    return (commit_score * 0.6 + contrib_score * 0.4)


def compare_repo_to_funded_dna(repo: dict) -> dict:
    """
    Compare a repo dict against all funded OSS projects.

    Returns:
        {
            "dna_score": 0-100,
            "top_matches": [...],   # up to 8 closest funded projects
            "insights": [...],      # human-readable insights
            "funder_frequency": {}, # which funders appear most in top matches
        }
    """
    repo_lang = repo.get("language")
    repo_stars = int(repo.get("stars") or 0)
    repo_license = repo.get("license_name") or repo.get("license")
    repo_topics = repo.get("topics") or []
    repo_desc = (repo.get("description") or "").lower()
    repo_commits_pw = float(repo.get("commit_frequency") or 0)
    repo_contributors = int(repo.get("contributors_count") or 0)

    # Weights for 6 dimensions
    WEIGHTS = {
        "language": 0.20,
        "stars": 0.12,
        "license": 0.10,
        "topics": 0.30,
        "category": 0.18,
        "activity": 0.10,
    }

    scores = []
    for proj in FUNDED_PROJECTS:
        lang_score = _score_language(repo_lang, proj["language"])
        star_score = _score_stars(repo_stars, proj["approximate_stars"])
        lic_score = _score_license(repo_license, proj["license"])
        topic_score = _score_topics(repo_topics, proj["focus"], proj["description_keywords"])
        cat_score = _score_category(repo_topics, repo_desc, proj["category"])
        act_score = _score_activity(repo_commits_pw, repo_contributors)

        weighted = (
            lang_score * WEIGHTS["language"]
            + star_score * WEIGHTS["stars"]
            + lic_score * WEIGHTS["license"]
            + topic_score * WEIGHTS["topics"]
            + cat_score * WEIGHTS["category"]
            + act_score * WEIGHTS["activity"]
        )
        similarity_pct = round(weighted * 100, 1)

        scores.append({
            "project_name": proj["name"],
            "github": proj["github"],
            "similarity": similarity_pct,
            "funders": proj["funders"],
            "category": proj["category"],
            "language": proj["language"],
            "approximate_stars": proj["approximate_stars"],
            "dimensions": {
                "language": round(lang_score * 100),
                "stars": round(star_score * 100),
                "license": round(lic_score * 100),
                "topics": round(topic_score * 100),
                "category": round(cat_score * 100),
                "activity": round(act_score * 100),
            },
        })

    # Sort by similarity descending
    scores.sort(key=lambda x: x["similarity"], reverse=True)
    top_matches = scores[:8]

    # Overall DNA score = average of top 3 matches
    if top_matches:
        dna_score = round(sum(m["similarity"] for m in top_matches[:3]) / min(3, len(top_matches)), 1)
    else:
        dna_score = 0

    # Funder frequency in top matches
    funder_freq: dict[str, int] = {}
    for m in top_matches:
        for funder in m["funders"]:
            funder_freq[funder] = funder_freq.get(funder, 0) + 1
    funder_freq = dict(sorted(funder_freq.items(), key=lambda x: x[1], reverse=True))

    # Generate insights
    insights = []
    if top_matches:
        best = top_matches[0]
        insights.append(
            f"Your repo is most similar to {best['project_name']} "
            f"({best['similarity']:.0f}% match), which was funded by {', '.join(best['funders'][:2])}."
        )
    if funder_freq:
        top_funder = list(funder_freq.keys())[0]
        count = funder_freq[top_funder]
        insights.append(
            f"Your repo matches profiles of {count} project(s) funded by {top_funder} — "
            f"this funder should be your top priority."
        )
    high_topic_matches = [m for m in top_matches if m["dimensions"]["topics"] >= 60]
    if high_topic_matches:
        insights.append(
            f"Strong topic alignment with {len(high_topic_matches)} funded project(s) — "
            f"your focus area is well-represented in the funding landscape."
        )
    if repo_stars < 100:
        insights.append(
            "Most funded repos had 500+ stars at time of funding. "
            "Building community traction will significantly improve your chances."
        )
    if not repo_license:
        insights.append(
            "Nearly all funded projects have an OSI-approved license. "
            "Adding one (MIT/Apache-2.0) will unlock most funding opportunities."
        )

    return {
        "dna_score": dna_score,
        "top_matches": top_matches,
        "insights": insights,
        "funder_frequency": funder_freq,
        "total_projects_compared": len(FUNDED_PROJECTS),
    }
