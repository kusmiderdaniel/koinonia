'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { isReservedSubdomain } from '@/lib/constants/subdomains'

// Check if a subdomain is available
export async function checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; error?: string }> {
  // Basic validation
  if (!subdomain || subdomain.length < 3) {
    return { available: false, error: 'Subdomain must be at least 3 characters' }
  }

  if (subdomain.length > 30) {
    return { available: false, error: 'Subdomain must be 30 characters or less' }
  }

  // Check format
  const validFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)
  if (!validFormat) {
    return { available: false, error: 'Invalid format' }
  }

  // Check if subdomain is reserved
  if (isReservedSubdomain(subdomain)) {
    return { available: false, error: 'This subdomain is reserved' }
  }

  const adminClient = createServiceRoleClient()

  const { data: existing } = await adminClient
    .from('churches')
    .select('id')
    .eq('subdomain', subdomain)
    .single()

  return { available: !existing }
}
