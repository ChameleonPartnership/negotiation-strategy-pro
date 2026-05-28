import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Target, BarChart3, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const features = [
    {
      icon: Target,
      title: 'Orientation Analysis',
      desc: 'Determine cooperative vs competitive stance through structured assessment',
    },
    {
      icon: BarChart3,
      title: 'Power State Mapping',
      desc: 'Quantify your negotiating power with our 10-dimension scoring model',
    },
    {
      icon: Zap,
      title: 'Strategy Selection',
      desc: 'From Capitulate to Impose — find the right strategy for your position',
    },
    {
      icon: FileText,
      title: 'Professional PDF Export',
      desc: 'Generate a complete, branded negotiation strategy document',
    },
  ]

  const steps = [
    'Project Setup',
    'Initial Scoping',
    'Negotiation Approach',
    'Approach to Value',
    'Power State Analysis',
    'Strategy Selection',
    'Phase Planning',
    'Action Planners',
    'Potential Problem Analysis',
    'Contingency Triggers',
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cp-navy)' }}>
      {/* Nav */}
      <nav className="border-b border-white/10 backdrop-blur-sm" style={{ background: 'var(--cp-navy)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/CP-Logo-Large-White.png"
              alt="Chameleon Partnership"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">
                Negotiation Strategy Pro
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--cp-ice)' }}>
                Chameleon Partnership
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(13, 148, 136, 0.4) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-teal-400 text-sm font-medium">
              Strategic Negotiation Planning
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Build Your Complete
            <br />
            <span className="text-teal-400">Negotiation Strategy</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Chameleon Partnership&apos;s structured 10-step methodology guides you from initial
            assessment to a fully developed negotiation strategy — with professional PDF export.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="text-white px-8 py-3 text-base"
                style={{ background: 'var(--cp-teal)' }}
              >
                Start Your Strategy <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_NNP_URL || 'https://www.negotiation-navigator.pro'}
              target="_blank"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/10 px-8 py-3 text-base"
                style={{ color: 'var(--cp-ice)' }}
              >
                Tactical Tool →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Everything you need to negotiate with confidence
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="nsp-card rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(129,230,217,0.15)' }}>
                  <f.icon className="w-5 h-5" style={{ color: 'var(--cp-ice)' }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 Steps */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            The 10-Step Strategy Framework
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-3 nsp-card rounded-lg px-4 py-3">
                <span className="font-bold text-sm w-6" style={{ color: 'var(--cp-ice)' }}>{i + 1}</span>
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--cp-teal)', opacity: 0.7 }} />
                <span className="text-white/80 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} Chameleon Partnership. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <Link
              href={process.env.NEXT_PUBLIC_NNP_URL || 'https://www.negotiation-navigator.pro'}
              target="_blank"
              className="hover:text-teal-400 transition-colors"
            >
              Negotiation Navigator Pro
            </Link>
            <Link href="/auth/login" className="hover:text-white/60 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
