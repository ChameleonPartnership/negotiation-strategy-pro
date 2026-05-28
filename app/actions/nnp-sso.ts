'use server'

/**
 * NNP SSO Action
 *
 * Checks if the current user exists in the Negotiation Navigator Pro Supabase project
 * and generates a magic link for SSO, or returns the signup URL.
 *
 * NOTE FOR PAUL: You need to add NNP_SERVICE_ROLE_KEY to your .env.local
 * (and to Vercel environment variables) before this SSO feature will work.
 * The NNP_SUPABASE_URL is already set to: https://zsoabbtcfgilyzkzegbw.supabase.co
 */

const NNP_SUPABASE_URL = process.env.NNP_SUPABASE_URL || 'https://zsoabbtcfgilyzkzegbw.supabase.co'
const NNP_SERVICE_ROLE_KEY = process.env.NNP_SERVICE_ROLE_KEY || ''
const NNP_SIGNUP_URL = 'https://www.negotiation-navigator.pro/auth/signup'
const NNP_BASE_URL = 'https://www.negotiation-navigator.pro'

export async function getNNPLink(email: string): Promise<{ url: string; isMagicLink: boolean }> {
  // If no NNP service role key configured, just return the NNP URL
  if (!NNP_SERVICE_ROLE_KEY) {
    return { url: NNP_BASE_URL, isMagicLink: false }
  }

  try {
    // Step 1: Check if the user exists in NNP Supabase project
    const listRes = await fetch(
      `${NNP_SUPABASE_URL}/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${NNP_SERVICE_ROLE_KEY}`,
          apikey: NNP_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!listRes.ok) {
      // Can't check — fall back to NNP home
      return { url: NNP_BASE_URL, isMagicLink: false }
    }

    const listData = await listRes.json()
    const users = listData.users || []
    const userExists = users.some(
      (u: { email: string }) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!userExists) {
      // User not in NNP — send to signup
      return { url: NNP_SIGNUP_URL, isMagicLink: false }
    }

    // Step 2: Generate a magic link for the user
    const magicRes = await fetch(`${NNP_SUPABASE_URL}/auth/v1/admin/users/${email}/magic-link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NNP_SERVICE_ROLE_KEY}`,
        apikey: NNP_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirect_to: NNP_BASE_URL,
      }),
    })

    if (!magicRes.ok) {
      // Magic link failed — send to NNP login
      return { url: `${NNP_BASE_URL}/auth/login`, isMagicLink: false }
    }

    const magicData = await magicRes.json()
    const magicLink = magicData?.action_link || magicData?.magic_link || `${NNP_BASE_URL}/auth/login`

    return { url: magicLink, isMagicLink: true }
  } catch {
    // Network/other error — fall back gracefully
    return { url: NNP_BASE_URL, isMagicLink: false }
  }
}
