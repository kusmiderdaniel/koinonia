'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChurch } from '@/hooks';
import { getChurch, getChurchMembers } from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type { Church as ChurchType, ChurchMembership } from '@/types/church';
import Link from 'next/link';

export default function ChurchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const churchId = params.id as string;
  const { currentMembership, setCurrentChurch } = useChurch();

  const [church, setChurch] = useState<ChurchType | null>(null);
  const [members, setMembers] = useState<ChurchMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadChurchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const churchData = await getChurch(churchId);
        const membersData = await getChurchMembers(churchId);

        setChurch(churchData);
        setMembers(membersData);
        setCurrentChurch(churchData);
      } catch (err: any) {
        console.error('Error loading church:', err);
        setError(err.message || 'Failed to load church');
      } finally {
        setLoading(false);
      }
    };

    loadChurchData();
  }, [churchId]);

  const copyInviteCode = async () => {
    if (church?.inviteCode) {
      await navigator.clipboard.writeText(church.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading church details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading church</p>
          <p className="text-sm mt-1">{error || 'Church not found'}</p>
        </div>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/churches')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Churches
        </Button>
      </div>
    );
  }

  const isAdmin = currentMembership?.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/churches"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Churches
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
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="invite">Invite</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {church.description && (
                <div>
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-muted-foreground">{church.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Address</h3>
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
                <h3 className="font-medium mb-2">Contact Information</h3>
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

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Church Members
              </CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'} in this church
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">Member ID: {member.userId}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="invite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Invite Code
                </CardTitle>
                <CardDescription>
                  Share this code with others to invite them to your church
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
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Anyone with this code can join your church as a member. Keep it secure and only
                  share with trusted individuals.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
