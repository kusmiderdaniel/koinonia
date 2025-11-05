'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { churches, currentChurch, setCurrentChurch } = useChurch();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
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
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo/Brand */}
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
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
                      {currentChurch?.name || 'Select Church'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[250px]">
                  <DropdownMenuLabel>My Churches</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {churches.map((church) => (
                    <DropdownMenuItem
                      key={church.id}
                      onClick={() => {
                        setCurrentChurch(church);
                        router.push(`/churches/${church.id}`);
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
                    onClick={() => router.push('/churches')}
                    className="cursor-pointer"
                  >
                    View All Churches
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/churches"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Churches
              </Link>
              <Link
                href="/events"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Events
              </Link>
              <Link
                href="/volunteers"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Volunteers
              </Link>
            </div>
          )}

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center space-x-4">
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
                    onClick={() => router.push('/dashboard')}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/auth/signin')}
                >
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
