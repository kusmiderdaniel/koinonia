'use server'

import { createClient } from '@/lib/supabase/server'

export async function checkUserProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasProfile: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return { hasProfile: !!profile }
}
