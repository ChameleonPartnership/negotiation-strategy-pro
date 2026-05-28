'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { WIZARD_STEPS } from '@/lib/decision-tree'

interface WizardLayoutProps {
  projectId: string
  projectName?: string
  currentStep: number
  completedSteps?: number[]
  children: React.ReactNode
}

export function WizardLayout({
  projectId,
  projectName,
  currentStep,
  completedSteps = [],
  children,
}: WizardLayoutProps) {
  const totalSteps = WIZARD_STEPS.length
  const progressPct = Math.round(((completedSteps.length) / totalSteps) * 100)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-navy)' }}>
      {/* Top header bar */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-teal-400 hover:text-teal-300 transition-colors">
              <span className="text-sm font-semibold tracking-wide">NSP</span>
            </Link>
            {projectName && (
              <>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className="text-sm text-white/70 truncate max-w-48">{projectName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: 'var(--brand-teal)' }}
              />
            </div>
            <span className="text-xs text-teal-400 font-medium">{progressPct}%</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar step navigator */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-white/10 pt-6 pb-8 sticky top-14 h-[calc(100vh-3.5rem)]" style={{ background: 'var(--cp-navy)' }}>
          <nav className="px-3 space-y-0.5">
            {WIZARD_STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.step)
              const isCurrent = step.step === currentStep
              const isAccessible = step.step <= currentStep || isCompleted

              return (
                <Link
                  key={step.key}
                  href={isAccessible ? `/strategy/${projectId}/${step.path}` : '#'}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all',
                    isCurrent
                      ? 'font-medium border hover:bg-white/5'
                      : isCompleted
                      ? 'hover:bg-white/5'
                      : isAccessible
                      ? 'text-white/60 hover:text-white/80 hover:bg-white/5'
                      : 'text-white/30 cursor-not-allowed'
                  )}
                  onClick={!isAccessible ? (e) => e.preventDefault() : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--cp-ice)' }} />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: 'var(--cp-ice)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cp-ice)' }} />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-white/30 flex-shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Back to hub */}
          <div className="mt-auto px-3">
            <Link
              href={`/strategy/${projectId}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              ← Strategy Hub
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}

interface WizardPageProps {
  title: string
  description?: string
  step: number
  totalSteps?: number
  children: React.ReactNode
  actions?: React.ReactNode
}

export function WizardPage({
  title,
  description,
  step,
  totalSteps = 10,
  children,
  actions,
}: WizardPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cp-ice)' }}>
            Step {step} of {totalSteps}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
        {description && <p className="text-white/60 text-base">{description}</p>}
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Actions */}
      {actions && <div className="mt-8 flex items-center justify-between">{actions}</div>}
    </div>
  )
}
