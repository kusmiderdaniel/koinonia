'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth, useChurch } from '@/hooks';
import { getChurch, getChurchMembersWithUsers, getChurchMembership, updateMemberRole } from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Church,
  MapPin,
  Mail,
  Phone,
  Globe,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Settings,
  Key,
} from 'lucide-react';
import type { Church as ChurchType, ChurchMembershipWithUser } from '@/types/church';
import Link from 'next/link';

export default function ChurchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('church');
  const tCommon = useTranslations('common');
  const churchId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentMembership, setCurrentChurch } = useChurch();

  const [church, setChurch] = useState<ChurchType | null>(null);
  const [members, setMembers] = useState<ChurchMembershipWithUser[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChurchMembershipWithUser | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) {
      return;
    }

    // If auth is ready and no user, redirect to sign in
    if (!user) {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    // Store current user ID
    setCurrentUserId(user.uid);

    let isMounted = true;

    const loadChurchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const churchData = await getChurch(churchId);

        if (!isMounted) return;

        setChurch(churchData);
        setCurrentChurch(churchData);

        // Fetch user's membership to check their role
        const membership = await getChurchMembership(churchId);

        if (!isMounted) return;

        if (membership) {
          setUserRole(membership.role);

          // Only fetch members if user is admin or leader
          if (membership.role === 'admin' || membership.role === 'leader') {
            const membersData = await getChurchMembersWithUsers(churchId);
            if (isMounted) {
              setMembers(membersData);
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading church:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load church');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChurchData();

    return () => {
      isMounted = false;
    };
  }, [churchId, authLoading, user, locale, router]);

  const copyInviteCode = async () => {
    if (church?.inviteCode) {
      await navigator.clipboard.writeText(church.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMemberClick = (member: ChurchMembershipWithUser) => {
    // Rule 1: Cannot click on yourself
    if (member.userId === currentUserId) {
      return;
    }

    // Rule 5: Admins can click on anyone (except themselves, handled above)
    if (isAdmin) {
      setSelectedMember(member);
      setNewRole(member.role);
      setMemberDialogOpen(true);
      return;
    }

    // Rule 5: Leaders can only click on members and volunteers
    if (isLeader && (member.role === 'member' || member.role === 'volunteer')) {
      setSelectedMember(member);
      setNewRole(member.role);
      setMemberDialogOpen(true);
      return;
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !newRole) return;

    setUpdating(true);
    try {
      await updateMemberRole(selectedMember.id, newRole as 'admin' | 'leader' | 'volunteer' | 'member');

      // Update the local members list
      setMembers(members.map(m =>
        m.id === selectedMember.id ? { ...m, role: newRole as any } : m
      ));

      setMemberDialogOpen(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Error updating member role:', error);
      alert(locale === 'pl'
        ? `Nie udało się zaktualizować roli: ${error.message}`
        : `Failed to update role: ${error.message}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'leader':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'volunteer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const canEditMember = (member: ChurchMembershipWithUser) => {
    // Cannot edit yourself
    if (member.userId === currentUserId) {
      return false;
    }

    // Admins can edit anyone except themselves
    if (isAdmin) {
      return true;
    }

    // Leaders can only edit members and volunteers
    if (isLeader && (member.role === 'member' || member.role === 'volunteer')) {
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Ładowanie szczegółów kościoła...' : 'Loading church details...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd ładowania kościoła' : 'Error loading church'}
          </p>
          <p className="text-sm mt-1">
            {error || (locale === 'pl' ? 'Kościół nie znaleziony' : 'Church not found')}
          </p>
        </div>
        <Button className="mt-4" variant="outline" onClick={() => router.push(`/${locale}/churches`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do kościołów' : 'Back to Churches'}
        </Button>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';
  const isLeader = userRole === 'leader' || isAdmin;
  const canViewMembers = isLeader;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/churches`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do kościołów' : 'Back to Churches'}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Church className="h-8 w-8" />
              {church.name}
            </h1>
            {church.denomination && (
              <p className="text-muted-foreground mt-1">{church.denomination}</p>
            )}
          </div>
          {isAdmin && (
            <Link href={`/${locale}/churches/${churchId}/settings`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                {locale === 'pl' ? 'Ustawienia' : 'Settings'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            {locale === 'pl' ? 'Przegląd' : 'Overview'}
          </TabsTrigger>
          {canViewMembers && (
            <TabsTrigger value="members">
              {locale === 'pl' ? `Członkowie (${members.length})` : `Members (${members.length})`}
            </TabsTrigger>
          )}
          {isLeader && (
            <TabsTrigger value="invite">
              {locale === 'pl' ? 'Zaproś' : 'Invite'}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'pl' ? 'Informacje o kościele' : 'Church Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {church.description && (
                <div>
                  <h3 className="font-medium mb-2">
                    {locale === 'pl' ? 'O nas' : 'About'}
                  </h3>
                  <p className="text-muted-foreground">{church.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">
                  {locale === 'pl' ? 'Adres' : 'Address'}
                </h3>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div>
                    <p>{church.address.street}</p>
                    <p>
                      {church.address.city}, {church.address.state} {church.address.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">
                  {locale === 'pl' ? 'Informacje kontaktowe' : 'Contact Information'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${church.contactInfo.email}`} className="hover:underline">
                      {church.contactInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${church.contactInfo.phone}`} className="hover:underline">
                      {church.contactInfo.phone}
                    </a>
                  </div>
                  {church.contactInfo.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={church.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {church.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewMembers && (
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {locale === 'pl' ? 'Członkowie kościoła' : 'Church Members'}
                </CardTitle>
                <CardDescription>
                  {locale === 'pl'
                    ? `${members.length} ${
                        members.length === 1
                          ? 'członek'
                          : members.length >= 2 && members.length <= 4
                          ? 'członków'
                          : 'członków'
                      } w tym kościele`
                    : `${members.length} ${members.length === 1 ? 'member' : 'members'} in this church`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => {
                    const isClickable = canEditMember(member);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isClickable ? 'cursor-pointer hover:bg-accent hover:shadow-sm transition-all' : ''
                        } ${member.userId === currentUserId ? 'bg-muted/50' : ''}`}
                        onClick={() => handleMemberClick(member)}
                      >
                      <div>
                        <p className="font-medium">{member.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {locale === 'pl' ? 'Dołączył' : 'Joined'}{' '}
                          {member.joinedAt.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US')}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                      >
                        {locale === 'pl'
                          ? member.role === 'admin'
                            ? 'Administrator'
                            : member.role === 'leader'
                            ? 'Lider'
                            : member.role === 'volunteer'
                            ? 'Wolontariusz'
                            : 'Członek'
                          : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="invite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {locale === 'pl' ? 'Kod zaproszenia' : 'Invite Code'}
                </CardTitle>
                <CardDescription>
                  {locale === 'pl'
                    ? 'Udostępnij ten kod innym, aby zaprosić ich do swojego kościoła'
                    : 'Share this code with others to invite them to your church'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-center h-16 bg-muted rounded-lg">
                      <p className="text-3xl font-mono font-bold tracking-wider">
                        {church.inviteCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={copyInviteCode}
                    className="h-16"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {locale === 'pl' ? 'Skopiowano!' : 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {locale === 'pl' ? 'Kopiuj kod' : 'Copy Code'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {locale === 'pl'
                    ? 'Każdy, kto posiada ten kod, może dołączyć do Twojego kościoła jako członek. Zachowaj go w bezpiecznym miejscu i udostępniaj tylko zaufanym osobom.'
                    : 'Anyone with this code can join your church as a member. Keep it secure and only share with trusted individuals.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Member Role Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'pl' ? 'Edytuj rolę członka' : 'Edit Member Role'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? `Zmień rolę dla ${selectedMember?.userName || 'tego członka'}`
                : `Change the role for ${selectedMember?.userName || 'this member'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">
                {locale === 'pl' ? 'Rola' : 'Role'}
              </Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={locale === 'pl' ? 'Wybierz rolę...' : 'Select role...'} />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && (
                    <>
                      <SelectItem value="admin">
                        {locale === 'pl' ? 'Administrator' : 'Admin'}
                      </SelectItem>
                      <SelectItem value="leader">
                        {locale === 'pl' ? 'Lider' : 'Leader'}
                      </SelectItem>
                    </>
                  )}
                  <SelectItem value="volunteer">
                    {locale === 'pl' ? 'Wolontariusz' : 'Volunteer'}
                  </SelectItem>
                  <SelectItem value="member">
                    {locale === 'pl' ? 'Członek' : 'Member'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {locale === 'pl' ? (
                <>
                  {isAdmin && (
                    <>
                      <p><strong>Administrator:</strong> Pełny dostęp, może przypisywać wszystkie role</p>
                      <p><strong>Lider:</strong> Może zarządzać wydarzeniami i rolami członków</p>
                    </>
                  )}
                  <p><strong>Wolontariusz:</strong> Może brać udział w służbach</p>
                  <p><strong>Członek:</strong> Podstawowy dostęp</p>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <>
                      <p><strong>Admin:</strong> Full access, can assign all roles</p>
                      <p><strong>Leader:</strong> Can manage events and member roles</p>
                    </>
                  )}
                  <p><strong>Volunteer:</strong> Can participate in services</p>
                  <p><strong>Member:</strong> Basic access</p>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setMemberDialogOpen(false)}
              disabled={updating}
            >
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button onClick={handleUpdateRole} disabled={updating || !newRole}>
              {updating
                ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving...')
                : (locale === 'pl' ? 'Zapisz' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
