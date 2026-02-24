;(function () {
  // Only run on repo pages (github.com/owner/repo)
  const path = window.location.pathname.split('/').filter(Boolean)
  if (path.length !== 2) return

  // Don't inject twice
  if (document.getElementById('opengrant-btn')) return

  // Hint badge
  const hint = document.createElement('div')
  hint.id = 'opengrant-hint'
  hint.textContent = '💰 OpenGrant'
  document.body.appendChild(hint)

  // Main button
  const btn = document.createElement('button')
  btn.id = 'opengrant-btn'
  btn.innerHTML = '💰 Find Funding'
  document.body.appendChild(btn)

  btn.addEventListener('click', async () => {
    btn.disabled = true
    btn.innerHTML = '⏳ Scanning…'

    try {
      const res = await fetch('http://localhost:8765/api/repos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: window.location.href }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      btn.innerHTML = '✅ Opening results…'
      window.open(`http://localhost:5173/results/${data.repo_id}`, '_blank')
    } catch (e) {
      alert('⚠️ OpenGrant is not running!\n\nStart it with START.bat first, then try again.')
    } finally {
      setTimeout(() => {
        btn.disabled = false
        btn.innerHTML = '💰 Find Funding'
      }, 2000)
    }
  })
})()
