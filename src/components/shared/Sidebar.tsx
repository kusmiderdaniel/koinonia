'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useChurch } from '@/hooks';
import { LayoutDashboard, Users, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const { currentChurch } = useChurch();

  // If no current church is selected, don't show sidebar
  if (!currentChurch) {
    return null;
  }

  const navigation = [
    {
      name: locale === 'pl' ? 'Panel' : 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: locale === 'pl' ? 'Ludzie' : 'People',
      href: `/${locale}/churches/${currentChurch.id}/people`,
      icon: Users,
    },
    {
      name: locale === 'pl' ? 'Wydarzenia' : 'Events',
      href: `/${locale}/churches/${currentChurch.id}/events`,
      icon: Calendar,
    },
    {
      name: locale === 'pl' ? 'Ustawienia' : 'Settings',
      href: `/${locale}/churches/${currentChurch.id}/settings`,
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-52 bg-background">
      <nav className="flex flex-col gap-1 px-3 pt-8 pb-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
