#!/usr/bin/env python3
"""
OpenGrant Skill Installer for OpenClaw
Copies SKILL.md to ~/.openclaw/workspace/skills/opengrant/
"""
import os, shutil, sys

HOME      = os.path.expanduser("~")
SKILL_SRC = os.path.join(os.path.dirname(__file__), "opengrant-skill", "SKILL.md")
SKILL_DST = os.path.join(HOME, ".openclaw", "workspace", "skills", "opengrant", "SKILL.md")

print("=" * 55)
print("  OpenGrant Skill Installer for OpenClaw")
print("=" * 55)

# Check source exists
if not os.path.exists(SKILL_SRC):
    print(f"  [ERR] SKILL.md not found at: {SKILL_SRC}")
    sys.exit(1)
print(f"  [OK]  Source: {SKILL_SRC}")

# Create destination directory
os.makedirs(os.path.dirname(SKILL_DST), exist_ok=True)
print(f"  [OK]  Skills dir: {os.path.dirname(SKILL_DST)}")

# Copy skill file
shutil.copy2(SKILL_SRC, SKILL_DST)
print(f"  [OK]  Installed: {SKILL_DST}")

# Check if openclaw is installed
openclaw_cfg = os.path.join(HOME, ".openclaw", "openclaw.json")
if os.path.exists(openclaw_cfg):
    print(f"  [OK]  OpenClaw config found: {openclaw_cfg}")
else:
    print(f"  [WARN] OpenClaw config not found at {openclaw_cfg}")
    print(f"         Make sure OpenClaw is installed: npm install -g openclaw@latest")

print()
print("=" * 55)
print("  DONE! OpenGrant skill installed.")
print()
print("  Now in Telegram, send your OpenClaw agent:")
print("  > https://github.com/owner/your-repo")
print()
print("  OpenClaw will automatically scan it and")
print("  show funding matches, grants, and more!")
print("=" * 55)
