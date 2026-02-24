/**
 * ApplicationModal — shows a full AI-generated grant application.
 * Supports copying individual sections and downloading as a .txt file.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatAmount } from '../utils/helpers'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="shrink-0 text-xs px-2 py-1 rounded-lg border border-white/10 text-slate-500 hover:text-sky-400 hover:border-sky-500/30 transition-all"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function Section({ title, icon, children, text }) {
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/3 border-b border-white/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        {text && <CopyButton text={text} />}
      </div>
      <div className="px-4 py-3 text-sm text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function buildFullText(app) {
  const budget = (app.budget || [])
    .map(b => `  • ${b.item}: $${(b.amount || 0).toLocaleString()} — ${b.justification}`)
    .join('\n')

  const timeline = (app.timeline || [])
    .map(t => `  • ${t.phase}: ${t.milestone}\n    Deliverable: ${t.deliverable}`)
    .join('\n')

  return `GRANT APPLICATION: ${app.funding_source_name || ''}
Project: ${app.repo_name || ''}
${'='.repeat(60)}

EXECUTIVE SUMMARY
${app.executive_summary || ''}

PROBLEM STATEMENT
${app.problem_statement || ''}

SOLUTION DESCRIPTION
${app.solution_description || ''}

TECHNICAL APPROACH
${app.technical_approach || ''}

TIMELINE
${timeline}

BUDGET
${budget}
Total: $${(app.total_budget || 0).toLocaleString()}

IMPACT & SUSTAINABILITY
${app.impact_statement || ''}

${app.sustainability_plan || ''}

WHY THIS FUND
${app.why_this_fund || ''}

TEAM
${app.team_description || ''}
`
}

export default function ApplicationModal({ app, fundingName, onClose, onSaveToTracker }) {
  const fullText = buildFullText(app)
  const totalBudget = app.total_budget || 0

  const download = () => {
    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `application-${(app.repo_name || 'repo').replace('/', '-')}-${(fundingName || 'fund').replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl glass-card overflow-hidden my-8"
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-950/90 backdrop-blur border-b border-white/5">
            <div>
              <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-0.5">
                AI Grant Application
              </div>
              <div className="text-white font-bold text-lg leading-tight">
                {fundingName}
              </div>
              <div className="text-slate-500 text-sm">{app.repo_name}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={download}
                className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-sky-500/40 text-slate-400 hover:text-sky-400 rounded-xl px-3 py-2 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download .txt
              </button>
              {onSaveToTracker && (
                <button
                  onClick={onSaveToTracker}
                  className="inline-flex items-center gap-1.5 text-sm bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-xl px-3 py-2 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save to Tracker
                </button>
              )}
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <CopyButton text={fullText} />
              <span className="text-xs text-slate-600">Click any section to copy individually</span>
            </div>

            <Section title="Executive Summary" icon="✦" text={app.executive_summary}>
              {app.executive_summary}
            </Section>

            <Section title="Problem Statement" icon="⚑" text={app.problem_statement}>
              {app.problem_statement}
            </Section>

            <Section title="Solution Description" icon="◈" text={app.solution_description}>
              {app.solution_description}
            </Section>

            <Section title="Technical Approach" icon="⌬" text={app.technical_approach}>
              {app.technical_approach}
            </Section>

            {/* Timeline */}
            <Section
              title="Project Timeline"
              icon="◷"
              text={(app.timeline || []).map(t => `${t.phase}: ${t.milestone} — ${t.deliverable}`).join('\n')}
            >
              <div className="space-y-3">
                {(app.timeline || []).map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg px-2 py-1 self-start">
                      {t.phase}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{t.milestone}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{t.deliverable}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Budget */}
            <Section
              title={`Budget Breakdown ${totalBudget > 0 ? `— Total: $${totalBudget.toLocaleString()}` : ''}`}
              icon="◎"
              text={(app.budget || []).map(b => `${b.item}: $${(b.amount||0).toLocaleString()} — ${b.justification}`).join('\n')}
            >
              <div className="space-y-2">
                {(app.budget || []).map((b, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{b.item}</div>
                      <div className="text-slate-500 text-xs">{b.justification}</div>
                    </div>
                    <div className="shrink-0 text-emerald-400 font-semibold text-sm">
                      {b.amount > 0 ? `$${b.amount.toLocaleString()}` : 'TBD'}
                    </div>
                  </div>
                ))}
                {totalBudget > 0 && (
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-emerald-400">${totalBudget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Impact & Sustainability" icon="◉" text={`${app.impact_statement}\n\n${app.sustainability_plan}`}>
              <p className="mb-3">{app.impact_statement}</p>
              <p className="text-slate-400">{app.sustainability_plan}</p>
            </Section>

            <Section title="Why This Fund" icon="♦" text={app.why_this_fund}>
              {app.why_this_fund}
            </Section>

            <Section title="Team Description" icon="◆" text={app.team_description}>
              {app.team_description}
            </Section>

            {/* Apply button */}
            {app.funding_source_url && (
              <a
                href={app.funding_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center mt-2"
              >
                Submit Application to {fundingName}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
