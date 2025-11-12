'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useChurch } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Church, Plus, Users, MapPin, Mail } from 'lucide-react';

export default function ChurchesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('church');
  const tCommon = useTranslations('common');
  const { churches, currentChurch, loading, error, setCurrentChurch } = useChurch();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Ładowanie kościołów...' : 'Loading churches...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd ładowania kościołów' : 'Error loading churches'}
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('myChurches')}</h1>
          <p className="text-muted-foreground">
            {churches.length === 0
              ? (locale === 'pl' ? 'Nie jesteś jeszcze członkiem żadnego kościoła' : 'You are not a member of any churches yet')
              : locale === 'pl'
                ? `Jesteś członkiem ${churches.length} ${churches.length === 1 ? 'kościoła' : 'kościołów'}`
                : `You are a member of ${churches.length} ${churches.length === 1 ? 'church' : 'churches'}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/churches/join`)}
          >
            <Users className="mr-2 h-4 w-4" />
            {t('joinChurch')}
          </Button>
          <Button onClick={() => router.push(`/${locale}/churches/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('createChurch')}
          </Button>
        </div>
      </div>

      {churches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Church className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {locale === 'pl' ? 'Jeszcze brak kościołów' : 'No Churches Yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t('noChurchesDescription')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/churches/join`)}
              >
                <Users className="mr-2 h-4 w-4" />
                {t('joinChurch')}
              </Button>
              <Button onClick={() => router.push(`/${locale}/churches/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('createChurch')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {churches.map((church) => (
            <Card
              key={church.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                currentChurch?.id === church.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setCurrentChurch(church);
                router.push(`/${locale}/churches/${church.id}`);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Church className="h-5 w-5" />
                      {church.name}
                    </CardTitle>
                    {church.denomination && (
                      <CardDescription className="mt-1">
                        {church.denomination}
                      </CardDescription>
                    )}
                  </div>
                  {currentChurch?.id === church.id && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {locale === 'pl' ? 'Aktywny' : 'Active'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {church.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {church.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {church.address.street}, {church.address.city}, {church.address.state} {church.address.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{church.contactInfo.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
