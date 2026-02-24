"""
SVG Badge Generator
====================
Generates shields.io-style SVG badges showing funding match count for a repo.
Usage in README.md:
  ![Funding](https://your-domain/badge/owner/repo.svg)
"""


def _text_width(text: str) -> int:
    """Approximate pixel width of text at font-size 11."""
    return sum(7 if c in "mMwW" else 5 if c in "fIijlrt1 " else 6 for c in text)


def generate_badge_svg(match_count: int, top_score: float = 0) -> str:
    """
    Generate a shields.io-style flat SVG badge.
    Left side: "FundMatcher"  Right side: "N matches" (color coded by score)
    """
    label = "FundMatcher"

    if match_count == 0:
        value = "no matches"
        color = "#9f9f9f"
    else:
        value = f"{match_count} match{'es' if match_count != 1 else ''}"
        if top_score >= 75:
            color = "#22c55e"   # green
        elif top_score >= 55:
            color = "#0ea5e9"   # sky
        elif top_score >= 35:
            color = "#f59e0b"   # amber
        else:
            color = "#6366f1"   # indigo

    lw = _text_width(label) + 18
    rw = _text_width(value) + 18
    tw = lw + rw
    lc = lw // 2
    rc = lw + rw // 2

    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{tw}" height="20" role="img" aria-label="{label}: {value}">
  <title>{label}: {value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".15"/>
    <stop offset="1" stop-opacity=".15"/>
  </linearGradient>
  <clipPath id="r"><rect width="{tw}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="{lw}" height="20" fill="#555"/>
    <rect x="{lw}" width="{rw}" height="20" fill="{color}"/>
    <rect width="{tw}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text aria-hidden="true" x="{lc}" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="{lc}" y="14">{label}</text>
    <text aria-hidden="true" x="{rc}" y="15" fill="#010101" fill-opacity=".3">{value}</text>
    <text x="{rc}" y="14">{value}</text>
  </g>
</svg>"""
