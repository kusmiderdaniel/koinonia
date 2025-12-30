'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'
import { ComponentProps, useCallback } from 'react'

type ProgressLinkProps = ComponentProps<typeof Link>

export function ProgressLink({ href, onClick, ...props }: ProgressLinkProps) {
  const pathname = usePathname()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only start progress if navigating to a different page
      const targetPath = typeof href === 'string' ? href : href.pathname
      if (targetPath && targetPath !== pathname) {
        NProgress.start()
      }
      onClick?.(e)
    },
    [href, pathname, onClick]
  )

  return <Link href={href} onClick={handleClick} {...props} />
}
