'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();

  // Hide navbar on auth pages for cleaner experience
  // Handle both /auth/ and /[locale]/auth/ patterns
  const hideNavbar = pathname?.match(/\/(pl|en)\/auth\//) || pathname?.startsWith('/auth/');

  // Show sidebar on dashboard and church-specific pages
  const showSidebar = !hideNavbar && (
    pathname?.match(/\/(pl|en)\/(dashboard|churches\/[^/]+\/(people|events|settings))/) !== null
  );

  return (
    <>
      {!hideNavbar && <Navbar />}
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'ml-52 pt-16' : hideNavbar ? '' : 'pt-16'}>
        {children}
      </main>
    </>
  );
}
