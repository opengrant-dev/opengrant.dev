"""
GitHub Twitter Post Generator
Automatically extracts GitHub repo data and generates Twitter-ready posts
"""

import asyncio
import os
from datetime import datetime
from github_api import fetch_repo_data, _parse_repo_url
import httpx

GITHUB_API_BASE = "https://api.github.com"

def _headers():
    """GitHub API headers"""
    h = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenGrant/1.0",
    }
    token = os.getenv("GITHUB_TOKEN", "")
    if token:
        h["Authorization"] = f"token {token}"
    return h


async def get_github_user_info(username: str) -> dict:
    """Fetch GitHub user profile data"""
    async with httpx.AsyncClient(headers=_headers(), timeout=20.0) as client:
        resp = await client.get(f"{GITHUB_API_BASE}/users/{username}")
        if resp.status_code == 200:
            data = resp.json()
            return {
                "name": data.get("name") or username,
                "bio": data.get("bio") or "Open Source Developer",
                "location": data.get("location") or "",
                "company": data.get("company") or "",
                "followers": data.get("followers", 0),
                "following": data.get("following", 0),
                "public_repos": data.get("public_repos", 0),
                "avatar_url": data.get("avatar_url"),
                "github_url": data.get("html_url"),
            }
    return {}


async def get_repo_stats(github_url: str) -> dict:
    """Fetch detailed repo statistics"""
    owner, repo = _parse_repo_url(github_url)
    repo_full_name = f"{owner}/{repo}"

    async with httpx.AsyncClient(headers=_headers(), timeout=20.0) as client:
        resp = await client.get(f"{GITHUB_API_BASE}/repos/{repo_full_name}")
        if resp.status_code == 200:
            data = resp.json()
            return {
                "name": data.get("name"),
                "description": data.get("description") or "Amazing project",
                "stars": data.get("stargazers_count", 0),
                "forks": data.get("forks_count", 0),
                "watchers": data.get("watchers_count", 0),
                "language": data.get("language") or "Multi-language",
                "topics": data.get("topics", [])[:3],  # Top 3 topics
                "url": data.get("html_url"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "owner": data.get("owner", {}).get("login"),
                "is_fork": data.get("fork", False),
                "open_issues": data.get("open_issues_count", 0),
                "license": data.get("license", {}).get("name") if data.get("license") else "MIT",
            }
    return {}


def generate_twitter_posts(user_info: dict, repo_stats: dict) -> list:
    """Generate multiple Twitter posts from GitHub data"""
    posts = []

    name = user_info.get("name", "Unknown")
    stars = repo_stats.get("stars", 0)
    repo_name = repo_stats.get("name", "Repository")
    description = repo_stats.get("description", "Amazing open source project")
    language = repo_stats.get("language", "Code")
    topics = repo_stats.get("topics", [])
    forks = repo_stats.get("forks", 0)
    license = repo_stats.get("license", "MIT")

    # Post 1: Simple announcement
    posts.append({
        "type": "announcement",
        "text": f"""🚀 Check out {repo_name}!

{description}

⭐ {stars} stars | 🍴 {forks} forks | 📚 {language}

Built with ❤️ by {name}

#OpenSource #GitHub #Coding""",
        "hashtags": "#OpenSource #GitHub #Coding"
    })

    # Post 2: Impact-focused
    if stars > 100:
        posts.append({
            "type": "impact",
            "text": f"""🌟 {stars}+ developers are using {repo_name}

{description}

Join the community 👇
{repo_stats.get('url')}

#OpenSource #Community""",
            "hashtags": "#OpenSource #Community"
        })

    # Post 3: Feature highlight
    if topics:
        topics_str = " ".join([f"#{t.title().replace('-', '')}" for t in topics])
        posts.append({
            "type": "features",
            "text": f"""✨ {repo_name} — Built with {language}

• {description}
• {stars}+ stars on GitHub
• {license} licensed
• Active & maintained

Explore: {repo_stats.get('url')}

{topics_str}""",
            "hashtags": topics_str
        })

    # Post 4: Developer spotlight
    posts.append({
        "type": "spotlight",
        "text": f"""Meet {name} 👋

Creating amazing open source with {repo_name}

{description}

Support their work 👉 {repo_stats.get('url')}

#OpenSource #Developer #Community""",
            "hashtags": "#OpenSource #Developer #Community"
    })

    # Post 5: Call-to-action
    posts.append({
        "type": "cta",
        "text": f"""Looking for {language} projects? 👀

Check out {repo_name}
⭐ {stars} stars | {forks} forks

{description}

Start here: {repo_stats.get('url')}

#OpenSource #GitHub""",
        "hashtags": "#OpenSource #GitHub"
    })

    # Post 6: Stats-focused
    posts.append({
        "type": "stats",
        "text": f"""By the numbers:

{repo_name}
📊 {stars} ⭐ stars
🍴 {forks} forks
💻 {language}
📜 {license} License

Made with 🔥 by {name}

{repo_stats.get('url')}

#OpenSource #Stats""",
        "hashtags": "#OpenSource #Stats"
    })

    return posts


async def extract_and_generate(github_url: str) -> dict:
    """Main function: Extract GitHub data and generate posts"""
    try:
        owner, repo = _parse_repo_url(github_url)

        # Fetch user info
        user_info = await get_github_user_info(owner)

        # Fetch repo stats
        repo_stats = await get_repo_stats(github_url)

        # Generate posts
        posts = generate_twitter_posts(user_info, repo_stats)

        return {
            "success": True,
            "user": user_info,
            "repo": repo_stats,
            "posts": posts,
            "generated_at": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Example usage
if __name__ == "__main__":
    # Test with OpenGrant repo
    repo_url = "https://github.com/opengrant-dev/opengrant.dev"

    result = asyncio.run(extract_and_generate(repo_url))

    if result["success"]:
        print("\n" + "="*70)
        print("GITHUB USER INFO")
        print("="*70)
        user = result["user"]
        print(f"Name: {user.get('name')}")
        print(f"Bio: {user.get('bio')}")
        print(f"Location: {user.get('location')}")
        print(f"Followers: {user.get('followers')}")
        print(f"GitHub: {user.get('github_url')}")

        print("\n" + "="*70)
        print("REPO STATS")
        print("="*70)
        repo = result["repo"]
        print(f"Name: {repo.get('name')}")
        print(f"Stars: {repo.get('stars')}")
        print(f"Forks: {repo.get('forks')}")
        print(f"Language: {repo.get('language')}")
        print(f"Topics: {', '.join(repo.get('topics', []))}")
        print(f"License: {repo.get('license')}")
        print(f"URL: {repo.get('url')}")

        print("\n" + "="*70)
        print("GENERATED TWITTER POSTS")
        print("="*70)
        for i, post in enumerate(result["posts"], 1):
            print(f"\n📱 POST {i} ({post['type'].upper()})")
            print("-" * 70)
            print(post["text"])
            print(f"\nHashtags: {post['hashtags']}")
            print(f"Character count: {len(post['text'])}")
    else:
        print(f"Error: {result['error']}")
