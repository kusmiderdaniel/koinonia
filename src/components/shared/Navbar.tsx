'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth, useChurch } from '@/hooks';
import { signOut } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Church, ChevronDown, Check } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');
  const { user, isAuthenticated } = useAuth();
  const { churches, currentChurch, setCurrentChurch } = useChurch();

  // Extract locale from pathname (e.g., /pl/dashboard -> pl)
  const locale = pathname?.match(/^\/(pl|en)\//)?.[1] || 'pl';

  const handleLogout = async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo/Brand */}
            <Link href={isAuthenticated ? `/${locale}/dashboard` : `/${locale}`} className="flex items-center space-x-2">
              <Church className="h-6 w-6" />
              <span className="text-xl font-bold">Koinonia</span>
            </Link>

            {/* Church Switcher */}
            {isAuthenticated && churches.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Church className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">
                      {currentChurch?.name || (locale === 'pl' ? 'Wybierz kościół' : 'Select Church')}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[250px]">
                  <DropdownMenuLabel>{locale === 'pl' ? 'Moje kościoły' : 'My Churches'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {churches.map((church) => (
                    <DropdownMenuItem
                      key={church.id}
                      onClick={() => {
                        setCurrentChurch(church);
                        router.push(`/${locale}/churches/${church.id}`);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{church.name}</p>
                          {church.denomination && (
                            <p className="text-xs text-muted-foreground truncate">
                              {church.denomination}
                            </p>
                          )}
                        </div>
                        {currentChurch?.id === church.id && (
                          <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/${locale}/churches`)}
                    className="cursor-pointer"
                  >
                    {locale === 'pl' ? 'Zobacz wszystkie kościoły' : 'View All Churches'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user?.photoURL || undefined}
                        alt={user?.displayName || 'User'}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/${locale}/dashboard`)}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>{locale === 'pl' ? 'Panel' : 'Dashboard'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/${locale}/settings`)}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{locale === 'pl' ? 'Ustawienia' : 'Settings'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/auth/signin`)}
                >
                  {t('signIn')}
                </Button>
                <Button onClick={() => router.push(`/${locale}/auth/signup`)}>
                  {t('signUp')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
