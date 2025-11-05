'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();

  // Hide navbar on auth pages for cleaner experience
  const hideNavbar = pathname?.startsWith('/auth/');

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}
