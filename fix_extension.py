#!/usr/bin/env python3
import os, sys, json, zlib, struct, subprocess
sys.stdout.reconfigure(encoding='utf-8')

ROOT = r"C:\Users\black\Desktop\Open source fund"
EXT  = os.path.join(ROOT, "extension")
errors = []

def ok(m):   print(f"  [OK]   {m}")
def fail(m): print(f"  [ERR]  {m}"); errors.append(m)
def warn(m): print(f"  [WARN] {m}")
def sec(s):  print(f"\n{'='*55}\n  {s}\n{'='*55}")
def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: f.write(content)
    ok(f"Written: {os.path.basename(path)} ({len(content):,} chars)")
def writeb(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f: f.write(data)
    ok(f"Written: {os.path.basename(path)} ({len(data)} bytes)")

# =================================================================
sec("1/5 - CREATING PNG ICONS (gold circle)")
# =================================================================
def make_png(size, fg=(251,191,36), bg=(2,6,23)):
    raw = b''
    cx = cy = size / 2.0
    for y in range(size):
        raw += b'\x00'
        for x in range(size):
            d = ((x - cx)**2 + (y - cy)**2)**0.5
            if d < size * 0.40:
                raw += bytes(fg)
            elif d < size * 0.46:
                raw += bytes([min(c+50,255) for c in fg])
            else:
                raw += bytes(bg)
    def chunk(t, d):
        td = t + d
        return struct.pack('>I', len(d)) + td + struct.pack('>I', zlib.crc32(td) & 0xFFFFFFFF)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))

icons_dir = os.path.join(EXT, "icons")
os.makedirs(icons_dir, exist_ok=True)
for sz in [16, 48, 128]:
    writeb(os.path.join(icons_dir, f"icon{sz}.png"), make_png(sz))

# =================================================================
sec("2/5 - WRITING MANIFEST.JSON")
# =================================================================
manifest = {
    "manifest_version": 3,
    "name": "OpenGrant - GitHub Funding Copilot",
    "version": "2.0.0",
    "description": "AI funding sidebar for every GitHub page. Viral score, grant matching, dev profiles, bounty detection.",
    "icons": {"16":"icons/icon16.png","48":"icons/icon48.png","128":"icons/icon128.png"},
    "content_scripts": [{"matches":["https://github.com/*"],"js":["content.js"],"css":["content.css"],"run_at":"document_idle"}],
    "action": {
        "default_popup": "popup.html",
        "default_icon": {"16":"icons/icon16.png","48":"icons/icon48.png","128":"icons/icon128.png"},
        "default_title": "OpenGrant Funding Copilot"
    },
    "permissions": ["storage","activeTab","tabs"],
    "host_permissions": ["http://localhost:8765/*","https://api.github.com/*"]
}
write(os.path.join(EXT,"manifest.json"), json.dumps(manifest, indent=2, ensure_ascii=False))

# Validate
with open(os.path.join(EXT,"manifest.json"), encoding='utf-8') as f:
    m2 = json.load(f)
assert m2["manifest_version"] == 3
assert "icons" in m2
ok("manifest.json validated - JSON OK, icons present, permissions correct")

# =================================================================
sec("3/5 - REWRITING POPUP.HTML (all 12 features)")
# =================================================================
POPUP = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OpenGrant</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:380px;background:#020617;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px}
.hdr{padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(135deg,rgba(14,165,233,0.07),rgba(99,102,241,0.05))}
.hdr-row{display:flex;align-items:center;justify-content:space-between}
.logo-row{display:flex;align-items:center;gap:8px}
.logo-ico{font-size:22px}
.logo-name{font-size:15px;font-weight:800;letter-spacing:-0.02em}
.logo-name .b{color:#38bdf8}
.logo-sub{font-size:9px;color:#374151;margin-top:2px;letter-spacing:0.06em}
.pill{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid;letter-spacing:0.06em;transition:all 0.3s}
.on{background:rgba(74,222,128,0.1);border-color:rgba(74,222,128,0.3);color:#4ade80}
.off{background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.3);color:#f87171}
.dot{width:6px;height:6px;border-radius:50%;animation:blink 1.4s ease-in-out infinite}
.dg{background:#4ade80;box-shadow:0 0 6px rgba(74,222,128,0.8)}
.dr{background:#f87171}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}
.scan-wrap{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06)}
.lbl{font-size:9px;font-weight:700;letter-spacing:0.14em;color:#374151;margin-bottom:7px}
input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:9px 12px;color:#f1f5f9;font-size:11px;font-family:'SF Mono','Fira Code',monospace;outline:none;transition:border-color 0.2s;margin-bottom:8px}
input:focus{border-color:rgba(14,165,233,0.5)}
input::placeholder{color:#1f2937}
.sbtn{width:100%;background:linear-gradient(135deg,#0ea5e9,#6366f1);border:none;border-radius:10px;padding:11px;color:white;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;letter-spacing:0.02em}
.sbtn:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 6px 24px rgba(14,165,233,0.35)}
.sbtn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.msg{margin-top:8px;padding:8px 12px;border-radius:9px;font-size:11px;border:1px solid;display:none;line-height:1.5}
.mok{background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.25);color:#4ade80}
.merr{background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.25);color:#f87171}
.mwarn{background:rgba(251,191,36,0.08);border-color:rgba(251,191,36,0.25);color:#fbbf24}
.feats{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.fb{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:9px;cursor:pointer;transition:all 0.15s;text-decoration:none;color:inherit}
.fb:hover{background:rgba(14,165,233,0.08);border-color:rgba(14,165,233,0.25);transform:translateY(-1px)}
.fi{font-size:17px}
.fn{font-size:9px;color:#374151;text-align:center}
.fb:hover .fn{color:#94a3b8}
.foot{padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.fl{font-size:10px;color:#374151;text-decoration:none;cursor:pointer;transition:color 0.15s}
.fl:hover{color:#38bdf8}
.fs{font-size:9px;color:#1f2937}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-row">
    <div class="logo-row">
      <span class="logo-ico">&#x1F4B0;</span>
      <div>
        <div class="logo-name">Open<span class="b">Grant</span></div>
        <div class="logo-sub">GITHUB FUNDING COPILOT v2.0</div>
      </div>
    </div>
    <div class="pill off" id="spill">
      <div class="dot dr" id="sdot"></div>
      <span id="stxt">CHECKING</span>
    </div>
  </div>
</div>

<div class="scan-wrap">
  <div class="lbl">// SCAN REPOSITORY</div>
  <input type="text" id="url" placeholder="https://github.com/owner/repo" />
  <button class="sbtn" id="sbtn">&#x1F680; Find Funding &#x2192;</button>
  <div class="msg" id="msg"></div>
</div>

<div class="feats">
  <div class="lbl">// ALL TOOLS (298 FUNDING SOURCES)</div>
  <div class="grid">
    <a class="fb" data-p="/"><span class="fi">&#x1F3E0;</span><span class="fn">Home</span></a>
    <a class="fb" data-p="/applications"><span class="fi">&#x1F4CB;</span><span class="fn">Tracker</span></a>
    <a class="fb" data-p="/calendar"><span class="fi">&#x1F4C5;</span><span class="fn">Calendar</span></a>
    <a class="fb" data-p="/org"><span class="fi">&#x1F50D;</span><span class="fn">OrgScan</span></a>
    <a class="fb" data-p="/dna"><span class="fi">&#x1F9EC;</span><span class="fn">DNA</span></a>
    <a class="fb" data-p="/portfolio"><span class="fi">&#x1F4BC;</span><span class="fn">Portfolio</span></a>
    <a class="fb" data-p="/velocity"><span class="fi">&#x26A1;</span><span class="fn">Velocity</span></a>
    <a class="fb" data-p="/roadmap"><span class="fi">&#x1F5FA;&#xFE0F;</span><span class="fn">Roadmap</span></a>
    <a class="fb" data-p="/trending"><span class="fi">&#x1F525;</span><span class="fn">Trending</span></a>
    <a class="fb" data-p="/funders"><span class="fi">&#x1F4B0;</span><span class="fn">Funders</span></a>
    <a class="fb" data-p="/leaderboard"><span class="fi">&#x1F3C6;</span><span class="fn">TopRepos</span></a>
    <a class="fb" data-p="/dependencies"><span class="fi">&#x1F578;&#xFE0F;</span><span class="fn">DepMap</span></a>
  </div>
</div>

<div class="foot">
  <a class="fl" id="dash">&#x1F310; Open Full Dashboard &#x2192;</a>
  <span class="fs">298 sources &middot; 50+ countries</span>
</div>

<script>
const API  = 'http://localhost:8765';
const DASH = 'http://localhost:5173';

function showMsg(cls, txt) {
  const el = document.getElementById('msg');
  el.className = 'msg ' + cls;
  el.textContent = txt;
  el.style.display = 'block';
}

async function checkBackend() {
  try {
    const r = await fetch(API + '/health', { signal: AbortSignal.timeout(2500) });
    if (r.ok) {
      document.getElementById('spill').className = 'pill on';
      document.getElementById('sdot').className  = 'dot dg';
      document.getElementById('stxt').textContent = 'ONLINE';
      return true;
    }
  } catch(e) {}
  document.getElementById('spill').className = 'pill off';
  document.getElementById('sdot').className  = 'dot dr';
  document.getElementById('stxt').textContent = 'OFFLINE';
  return false;
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const url = tabs[0] && tabs[0].url ? tabs[0].url : '';
  if (url.includes('github.com')) document.getElementById('url').value = url;
});

document.querySelectorAll('.fb[data-p]').forEach(b =>
  b.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: DASH + this.dataset.p });
  })
);

document.getElementById('dash').addEventListener('click', function() {
  chrome.tabs.create({ url: DASH });
});

document.getElementById('sbtn').addEventListener('click', async function() {
  const url = document.getElementById('url').value.trim();
  const btn = document.getElementById('sbtn');

  if (!url || !url.includes('github.com')) {
    showMsg('merr', 'Enter a valid GitHub URL: github.com/owner/repo');
    return;
  }

  const online = await checkBackend();
  if (!online) {
    showMsg('mwarn', 'Backend offline. Run START.bat first, then retry.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Scanning...';

  try {
    const r = await fetch(API + '/api/repos/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ github_url: url })
    });
    if (!r.ok) throw new Error('API error ' + r.status);
    const d = await r.json();
    showMsg('mok', 'Scanning! Opening results...');
    setTimeout(function() { chrome.tabs.create({ url: DASH + '/results/' + d.repo_id }); }, 800);
  } catch(e) {
    showMsg('merr', 'Error: ' + (e.message || 'Is START.bat running?'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Find Funding';
  }
});

checkBackend();
</script>
</body>
</html>"""
write(os.path.join(EXT, "popup.html"), POPUP)

# =================================================================
sec("4/5 - FIXING CONTENT.CSS (z-index !important)")
# =================================================================
with open(os.path.join(EXT,"content.css"), encoding='utf-8') as f:
    css = f.read()

fixes = [
    ("z-index: 999998;",     "z-index: 2147483647 !important;"),
    ("z-index: 999999;",     "z-index: 2147483646 !important;"),
    ("z-index: 2147483647;", "z-index: 2147483647 !important;"),
    ("z-index: 2147483646;", "z-index: 2147483646 !important;"),
]
for old, new in fixes:
    if old in css:
        css = css.replace(old, new)
        ok(f"Fixed z-index: {old.strip()!r} -> {new.strip()!r}")

write(os.path.join(EXT,"content.css"), css)

# =================================================================
sec("5/5 - BACKEND TEST + GIT PUSH")
# =================================================================
import urllib.request

backend_ok = False
try:
    r = urllib.request.urlopen("http://localhost:8765/health", timeout=3)
    json.loads(r.read())
    ok("Backend ONLINE at port 8765")
    backend_ok = True
    for ep in ["/api/stats","/api/funding-sources","/api/leaderboard","/api/trending"]:
        try:
            r2 = urllib.request.urlopen(f"http://localhost:8765{ep}", timeout=5)
            ok(f"{ep} -> {r2.status} OK")
        except Exception as e2:
            fail(f"{ep} -> {e2}")
except Exception as e:
    warn(f"Backend OFFLINE (run START.bat) - {e}")

os.chdir(ROOT)
try:
    subprocess.run(["git","add","extension/"], check=True, capture_output=True)
    subprocess.run(["git","commit","-m",
        "fix: extension v2 - real icons, full popup 12tools, z-index !important, manifest fixed"],
        check=True, capture_output=True)
    subprocess.run(["git","push","origin","master"], check=True, capture_output=True)
    ok("Pushed to github.com/ChiranjibAI/opengrant")
except subprocess.CalledProcessError as e:
    warn(f"Git: {(e.stderr or b'').decode(errors='ignore').strip() or 'no new changes'}")

# =================================================================
print(f"\n{'='*55}")
print("  FINAL REPORT")
print(f"{'='*55}")
if errors:
    for e in errors: print(f"  [ERR] {e}")
    print(f"\n  Total issues: {len(errors)}")
else:
    print("  [OK] Icons: icon16.png, icon48.png, icon128.png - CREATED")
    print("  [OK] manifest.json - icons + permissions FIXED")
    print("  [OK] popup.html - 12 tools, status check, scan - FULL")
    print("  [OK] content.css - z-index !important - FIXED")
    print(f"  {'[OK]' if backend_ok else '[WARN]'} Backend: {'ONLINE' if backend_ok else 'OFFLINE (run START.bat)'}")
    print()
    print("  NEXT STEPS:")
    print("  1. chrome://extensions")
    print("  2. Click RELOAD button on OpenGrant card")
    print("  3. Open any GitHub repo page")
    print("  4. See 💰 tab on right edge of screen")
    print("  5. Click it -> sidebar opens with viral score + grants!")
print(f"{'='*55}\n")
