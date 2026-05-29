'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { APPROACH_DESCRIPTIONS, STRATEGY_DESCRIPTIONS, POWER_STATE_RANGES } from '@/lib/decision-tree'
import {
  FileText, Download, ChevronLeft, CheckCircle,
  Users, Swords, BarChart3, Target, Zap, AlertTriangle, ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [data, setData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [
      { data: project },
      { data: scoping },
      { data: orientation },
      { data: approach },
      { data: powerState },
      { data: strategy },
      { data: scenarios },
      { data: triggers },
      { data: ppaRows },
    ] = await Promise.all([
      supabase.from('strategy_projects').select('*').eq('id', pid).single(),
      supabase.from('scoping').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('orientation').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('approach').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('power_state').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('strategy_selection').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('scenarios').select('*').eq('project_id', pid).order('scenario_number'),
      supabase.from('triggers').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('ppa').select('*').eq('project_id', pid),
    ])

    if (!project) { router.push('/dashboard'); return }

    // Get phase planners for each scenario
    const enrichedScenarios = await Promise.all(
      (scenarios || []).map(async (s) => {
        const { data: pp } = await supabase.from('phase_planners').select('*').eq('scenario_id', s.id).maybeSingle()
        return { ...s, ...(pp || {}) }
      })
    )

    setData({ project, scoping, orientation, approach, powerState, strategy, scenarios: enrichedScenarios, triggers, ppa: ppaRows || [] })
    setLoading(false)
  }

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      const { generateStrategyPDF } = await import('@/lib/pdf-generator')
      const blob = await generateStrategyPDF(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const project = data.project as Record<string, string>
      a.download = `negotiation-strategy-${project?.name?.replace(/\s+/g, '-').toLowerCase() || 'report'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error('Failed to generate PDF: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = data.project as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orientation = data.orientation as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approach = data.approach as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const powerState = data.powerState as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strategy = data.strategy as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenarios = data.scenarios as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggers = data.triggers as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ppa = (data.ppa as any[]) || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoping = data.scoping as any

  const powerRange = powerState?.power_state
    ? POWER_STATE_RANGES.find((r) => r.state === powerState.power_state)
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={`/strategy/${id}`} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Strategy Hub</span>
          </Link>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Cover card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f1629 0%, #0d3340 100%)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10">
            <div className="text-teal-400 text-xs tracking-widest uppercase mb-2">Negotiation Strategy Pro</div>
            <h1 className="text-3xl font-bold text-white mb-1">{project?.name}</h1>
            {project?.negotiation_for && <p className="text-white/50">{project.negotiation_for}</p>}
            <div className="flex flex-wrap gap-3 mt-4">
              {orientation?.result && (
                <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full capitalize">
                  {orientation.result as string} Orientation
                </span>
              )}
              {powerState?.power_state && (
                <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full capitalize">
                  {powerState.power_state as string} Power
                </span>
              )}
              {strategy?.final_strategy && (
                <span className="text-xs bg-teal-500/30 text-teal-300 px-3 py-1 rounded-full font-medium">
                  {strategy.final_strategy as string}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Results summary grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard
            icon={orientation?.result === 'cooperative' ? Users : Swords}
            label="Orientation"
            value={orientation?.result ? (orientation.result as string).charAt(0).toUpperCase() + (orientation.result as string).slice(1) : '—'}
            sub={orientation?.result === 'cooperative' ? 'Seek mutual gain' : 'Assert your position'}
          />
          <ReportCard
            icon={Target}
            label="Approach"
            value={approach?.result ? (approach.result as string).charAt(0).toUpperCase() + (approach.result as string).slice(1) : '—'}
            sub={approach?.result ? APPROACH_DESCRIPTIONS[approach.result as keyof typeof APPROACH_DESCRIPTIONS] : ''}
          />
          <ReportCard
            icon={BarChart3}
            label="Power State"
            value={powerState?.power_state ? (powerState.power_state as string).charAt(0).toUpperCase() + (powerState.power_state as string).slice(1) : '—'}
            sub={powerState?.total_score !== undefined ? `Score: ${powerState.total_score}/100` : ''}
          />
          <ReportCard
            icon={Zap}
            label="Strategy"
            value={(strategy?.final_strategy as string) || '—'}
            sub={strategy?.final_strategy ? STRATEGY_DESCRIPTIONS[strategy.final_strategy as keyof typeof STRATEGY_DESCRIPTIONS] : ''}
            highlight
          />
        </div>

        {/* Scoping */}
        {scoping && (
          <ReportSection title="Initial Scoping">
            <div className="grid sm:grid-cols-2 gap-4">
              {scoping.our_outcomes && <FieldBlock label="Our Desired Outcomes" value={scoping.our_outcomes as string} />}
              {scoping.their_outcomes && <FieldBlock label="Their Likely Outcomes" value={scoping.their_outcomes as string} />}
              {scoping.main_issues && <FieldBlock label="Main Issues / Variables" value={scoping.main_issues as string} className="sm:col-span-2" />}
            </div>
          </ReportSection>
        )}

        {/* Power state gauge */}
        {powerState?.total_score !== undefined && (
          <ReportSection title="Power State Detail">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Score</span>
                <span className="text-white font-bold text-xl">{powerState.total_score as number} / 100</span>
              </div>
              <div className="relative h-8 rounded-lg overflow-hidden flex">
                {POWER_STATE_RANGES.map((range) => (
                  <div
                    key={range.state}
                    style={{
                      width: `${((range.max - range.min + 1) / 101) * 100}%`,
                      background: range.state === powerState.power_state ? '#0d9488' : 'rgba(255,255,255,0.06)',
                    }}
                    className="h-full flex items-center justify-center"
                  >
                    <span className="text-[9px] text-white/60 font-medium">{range.label}</span>
                  </div>
                ))}
                <div
                  className="absolute top-0 w-0.5 h-full bg-white opacity-80"
                  style={{ left: `${((powerState.total_score as number) / 100) * 100}%` }}
                />
              </div>
            </div>
          </ReportSection>
        )}

        {/* Scenarios */}
        {scenarios && scenarios.length > 0 && (
          <ReportSection title="Scenarios & Phase Plans">
            <div className="space-y-4">
              {scenarios.map((s, i) => (
                <div key={s.id as string} className="nsp-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-white font-medium">{(s.name as string) || `Scenario ${i + 1}`}</span>
                    {s.strategy && (
                      <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">{s.strategy as string}</span>
                    )}
                  </div>
                  {(s.trigger_a || s.trigger_b || s.trigger_c || s.trigger_d) && (
                    <div className="space-y-1">
                      {(['trigger_a', 'trigger_b', 'trigger_c', 'trigger_d'] as const).map((t, ti) =>
                        s[t] ? (
                          <div key={t} className="text-sm text-white/60">
                            <span className="text-white/30">Trigger {String.fromCharCode(65 + ti)}:</span>{' '}
                            {s[t] as string}
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* PPA */}
        {ppa.length > 0 && (
          <ReportSection title="Potential Problem Analysis">
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((variant) => {
                const rows = ppa.filter((r) => r.variant === variant || r.scenario_variant === variant)
                if (!rows.length) return null
                const col = variant === 'A' ? '#81E6D9' : variant === 'B' ? '#EF4136' : variant === 'C' ? '#D4AF37' : '#94a3b8'
                return (
                  <div key={variant} className="nsp-card rounded-xl overflow-hidden">
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: col, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      Scenario {variant}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-white/30 text-xs">
                            <th className="px-4 py-2 text-left">Problem / Tactic</th>
                            <th className="px-3 py-2 text-center">Prob.</th>
                            <th className="px-3 py-2 text-center">Serious.</th>
                            <th className="px-4 py-2 text-left">Preventative</th>
                            <th className="px-4 py-2 text-left">Contingency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => {
                            const riskColor = (row.probability === 'High' || row.seriousness === 'High') ? '#ef4444'
                              : (row.probability === 'Medium' && row.seriousness === 'Medium') ? '#eab308'
                              : '#22c55e'
                            return (
                              <tr key={i} className="border-t border-white/5">
                                <td className="px-4 py-2 text-white/80">{row.tactic}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${riskColor}22`, color: riskColor }}>{row.probability}</span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${riskColor}22`, color: riskColor }}>{row.seriousness}</span>
                                </td>
                                <td className="px-4 py-2 text-white/60 text-xs">{row.preventative_action}</td>
                                <td className="px-4 py-2 text-white/60 text-xs">{row.contingency_action}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </ReportSection>
        )}

        {/* Triggers */}
        {triggers && (triggers.trigger_data || triggers.a_to_b || triggers.b_to_c || triggers.c_to_d) && (
          <ReportSection title="Triggers & Escalation Plan">
            <div className="space-y-3">
              {/* Scenario cascade visual */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {['A','B','C','D'].map((s, i) => {
                  const cols = ['#81E6D9','#EF4136','#D4AF37','#94a3b8']
                  const scenarioNames = (scenarios || []).find((sc) => sc.scenario_number === i+1)
                  return (
                    <div key={s} className="text-center relative">
                      {i > 0 && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                          <ArrowDown className="w-3 h-3" style={{ color: cols[i-1], transform: 'rotate(-90deg)' }} />
                        </div>
                      )}
                      <div className="rounded-lg px-2 py-2" style={{ border: `1px solid ${cols[i]}44`, background: `${cols[i]}11` }}>
                        <div className="text-xs font-bold" style={{ color: cols[i] }}>Scenario {s}</div>
                        {scenarioNames?.strategy && <div className="text-white/50 text-xs mt-0.5">{scenarioNames.strategy}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Trigger groups */}
              {(['a_to_b', 'b_to_c', 'c_to_d'] as const).map((group) => {
                const groupTriggers = triggers[group]
                if (!groupTriggers || !Array.isArray(groupTriggers) || groupTriggers.length === 0) return null
                const labels: Record<string, string> = { a_to_b: 'A → B', b_to_c: 'B → C', c_to_d: 'C → D' }
                const active = groupTriggers.filter((t: { active?: boolean }) => t.active !== false)
                if (!active.length) return null
                return (
                  <div key={group} className="nsp-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#D4AF37' }} />
                      <span className="text-white/70 text-sm font-medium">Escalation Triggers: {labels[group]}</span>
                    </div>
                    <div className="space-y-2">
                      {active.map((t: { text?: string; label?: string; notes?: string }, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-white/80 text-sm">{t.text || t.label}</div>
                            {t.notes && <div className="text-white/40 text-xs mt-0.5">{t.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Legacy trigger_data fallback */}
              {!triggers.a_to_b && triggers.trigger_data && (
                <div className="nsp-card rounded-xl p-4">
                  <div className="space-y-2">
                    {Object.entries(triggers.trigger_data as Record<string, unknown>)
                      .filter(([, v]) => (v as Record<string, unknown>).active)
                      .map(([k, v]) => {
                        const entry = v as { notes?: string }
                        const texts = ['They are using delaying tactics','Discussions escalated to a higher level','They have dis-empowered themselves','They have presented no alternatives','They have only presented win/lose proposals','They have introduced time related deadlines','They have formally withdrawn from discussions','They have rejected ongoing dialogue','They are demonstrating indifference/intransigence','They have introduced threats or deadlines']
                        const idx = parseInt(k.replace('t', '')) - 1
                        return (
                          <div key={k} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-white/80 text-sm">{texts[idx]}</div>
                              {entry.notes && <div className="text-white/40 text-xs mt-1">{entry.notes}</div>}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </ReportSection>
        )}
      </main>
    </div>
  )
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function ReportCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`nsp-card rounded-xl p-4 ${highlight ? 'border border-teal-500/30 bg-teal-500/5' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-teal-400' : 'text-white/40'}`} />
        <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-bold text-lg ${highlight ? 'text-teal-300' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-white/40 text-xs mt-1 leading-snug line-clamp-2">{sub}</div>}
    </div>
  )
}

function FieldBlock({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`nsp-card rounded-lg p-4 ${className || ''}`}>
      <div className="text-white/40 text-xs uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
    </div>
  )
}
