// Reserved subdomains that cannot be used by churches

export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'dashboard',
  'mail',
  'email',
  'help',
  'support',
  'blog',
  'dev',
  'staging',
  'test',
] as const

export type ReservedSubdomain = typeof RESERVED_SUBDOMAINS[number]

/**
 * Check if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain as ReservedSubdomain)
}
