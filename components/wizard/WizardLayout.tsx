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
    <div className="min-h-screen flex flex-col" style={{ background: '#012A36' }}>
      {/* CP-branded top header */}
      <header
        className="border-b border-white/10 sticky top-0 z-50"
        style={{ background: 'linear-gradient(90deg, #012A36 0%, #03536A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: '#EF4136', color: '#F7FAFC' }}
              >
                NSP
              </div>
              <span className="text-sm font-semibold tracking-wide hidden sm:inline" style={{ color: '#81E6D9' }}>
                Strategy Pro
              </span>
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
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: '#81E6D9' }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: '#81E6D9' }}>{progressPct}%</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar step navigator */}
        <aside
          className="hidden lg:flex w-60 flex-col border-r border-white/10 pt-6 pb-8 sticky top-14 h-[calc(100vh-3.5rem)]"
          style={{ background: '#011E28' }}
        >
          <div className="px-4 mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#03536A' }}>
              Steps
            </div>
          </div>
          <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto">
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
                      ? 'font-semibold border'
                      : isCompleted
                      ? 'hover:bg-white/5'
                      : isAccessible
                      ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      : 'text-white/25 cursor-not-allowed'
                  )}
                  style={isCurrent ? {
                    background: 'rgba(3, 83, 106, 0.2)',
                    borderColor: 'rgba(129, 230, 217, 0.3)',
                    color: '#81E6D9',
                  } : isCompleted ? {
                    color: '#81E6D9',
                  } : {}}
                  onClick={!isAccessible ? (e) => e.preventDefault() : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#81E6D9' }} />
                  ) : isCurrent ? (
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{ borderColor: '#81E6D9' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#81E6D9' }} />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-white/25 flex-shrink-0" />
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-white/30 w-4 flex-shrink-0">{step.step}</span>
                    <span className="truncate">{step.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Back to hub */}
          <div className="px-3 pt-4 border-t border-white/10 mt-4">
            <Link
              href={`/strategy/${projectId}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
            >
              ← Strategy Hub
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0" style={{ background: '#012A36' }}>{children}</main>
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
  totalSteps = 9,
  children,
  actions,
}: WizardPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(3, 83, 106, 0.3)', color: '#81E6D9', border: '1px solid rgba(129, 230, 217, 0.2)' }}
          >
            Step {step} of {totalSteps}
          </div>
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
