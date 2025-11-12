'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Church, MapPin, Mail, Phone, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createChurchSchema, type CreateChurchFormData } from '@/lib/validations/church';
import { createChurch } from '@/lib/services/church';

export function CreateChurchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('church');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateChurchFormData>({
    resolver: zodResolver(createChurchSchema),
    defaultValues: {
      address: {
        country: 'PL',
      },
    },
  });

  const onSubmit = async (data: CreateChurchFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const church = await createChurch(data);
      router.push(`/${locale}/churches/${church.id}`);
    } catch (err: any) {
      setError(err.message || (locale === 'pl' ? 'Nie udało się utworzyć kościoła. Spróbuj ponownie.' : 'Failed to create church. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            {t('basicInformation')}
          </CardTitle>
          <CardDescription>
            {t('basicInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')} *</Label>
            <Input
              id="name"
              placeholder={locale === 'pl' ? 'Kościół Baptystyczny' : 'First Baptist Church'}
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="denomination">{t('denomination')}</Label>
            <Select
              onValueChange={(value) => setValue('denomination', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={locale === 'pl' ? 'Wybierz denominację...' : 'Select denomination...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kościół baptystyczny">Kościół baptystyczny</SelectItem>
                <SelectItem value="kościół zielonoświątkowy">Kościół zielonoświątkowy</SelectItem>
                <SelectItem value="kościół katolicki">Kościół katolicki</SelectItem>
                <SelectItem value="kościół metodystyczny">Kościół metodystyczny</SelectItem>
                <SelectItem value="kościół niedenominacyjny">Kościół niedenominacyjny</SelectItem>
                <SelectItem value="inny">Inny</SelectItem>
              </SelectContent>
            </Select>
            {errors.denomination && (
              <p className="text-sm text-destructive">{errors.denomination.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <textarea
              id="description"
              placeholder={locale === 'pl' ? 'Krótki opis Twojego kościoła...' : 'Brief description of your church...'}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('address')}
          </CardTitle>
          <CardDescription>
            {t('addressInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">{t('street')} *</Label>
            <Input
              id="street"
              placeholder="ul. Marszałkowska 1"
              {...register('address.street')}
              disabled={isLoading}
            />
            {errors.address?.street && (
              <p className="text-sm text-destructive">{errors.address.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t('city')} *</Label>
              <Input
                id="city"
                placeholder="Warszawa"
                {...register('address.city')}
                disabled={isLoading}
              />
              {errors.address?.city && (
                <p className="text-sm text-destructive">{errors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">{t('state')} *</Label>
              <Select
                onValueChange={(value) => setValue('address.state', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === 'pl' ? 'Wybierz województwo...' : 'Select voivodeship...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dolnośląskie">Dolnośląskie</SelectItem>
                  <SelectItem value="Kujawsko-pomorskie">Kujawsko-pomorskie</SelectItem>
                  <SelectItem value="Lubelskie">Lubelskie</SelectItem>
                  <SelectItem value="Lubuskie">Lubuskie</SelectItem>
                  <SelectItem value="Łódzkie">Łódzkie</SelectItem>
                  <SelectItem value="Małopolskie">Małopolskie</SelectItem>
                  <SelectItem value="Mazowieckie">Mazowieckie</SelectItem>
                  <SelectItem value="Opolskie">Opolskie</SelectItem>
                  <SelectItem value="Podkarpackie">Podkarpackie</SelectItem>
                  <SelectItem value="Podlaskie">Podlaskie</SelectItem>
                  <SelectItem value="Pomorskie">Pomorskie</SelectItem>
                  <SelectItem value="Śląskie">Śląskie</SelectItem>
                  <SelectItem value="Świętokrzyskie">Świętokrzyskie</SelectItem>
                  <SelectItem value="Warmińsko-mazurskie">Warmińsko-mazurskie</SelectItem>
                  <SelectItem value="Wielkopolskie">Wielkopolskie</SelectItem>
                  <SelectItem value="Zachodniopomorskie">Zachodniopomorskie</SelectItem>
                </SelectContent>
              </Select>
              {errors.address?.state && (
                <p className="text-sm text-destructive">{errors.address.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">{t('zipCode')} *</Label>
              <Input
                id="zipCode"
                placeholder="00-001"
                {...register('address.zipCode')}
                disabled={isLoading}
              />
              {errors.address?.zipCode && (
                <p className="text-sm text-destructive">{errors.address.zipCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('contactInformation')}
          </CardTitle>
          <CardDescription>
            {t('contactInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')} *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="info@church.org"
                className="pl-10"
                {...register('contactInfo.email')}
                disabled={isLoading}
              />
            </div>
            {errors.contactInfo?.email && (
              <p className="text-sm text-destructive">{errors.contactInfo.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')} *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+48 123 456 789"
                className="pl-10"
                {...register('contactInfo.phone')}
                disabled={isLoading}
              />
            </div>
            {errors.contactInfo?.phone && (
              <p className="text-sm text-destructive">{errors.contactInfo.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{t('website')}</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                placeholder="https://www.yourchurch.org"
                className="pl-10"
                {...register('contactInfo.website')}
                disabled={isLoading}
              />
            </div>
            {errors.contactInfo?.website && (
              <p className="text-sm text-destructive">{errors.contactInfo.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('creating') : t('createChurch')}
        </Button>
      </div>
    </form>
  );
}
