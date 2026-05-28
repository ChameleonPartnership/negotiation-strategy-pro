'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-white/70">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-white/70">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white mt-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Sign In
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--brand-navy)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-white font-bold text-xl mb-1">Negotiation Strategy Pro</div>
          <div className="text-teal-400 text-xs tracking-widest uppercase">
            Chameleon Partnership
          </div>
        </div>

        {/* Card */}
        <div className="nsp-card rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/50 text-sm mb-6">Sign in to your account</p>

          <Suspense fallback={<div className="text-white/40 text-sm">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-white/40 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-teal-400 hover:text-teal-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
