'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { api } from '@web/lib/api';
import { useSession } from '@web/lib/auth-client';
import { PageHeader } from '@web/components/shared/page-header';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@web/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@web/components/ui/table';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(session?.user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const userRole = (session?.user as unknown as User | undefined)?.role;
  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    api.users.list().then((u) => {
      if (cancelled) return;
      setUsers(u as User[]);
    }).finally(() => { if (!cancelled) setLoadingUsers(false); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.users.updateMe({ name });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.users.updateRole(userId, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (!session) return <LoadingSkeleton />;

  return (
    <div>
      <PageHeader title="Settings" />

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session.user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin: User management */}
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">User Management</CardTitle></CardHeader>
          <CardContent>
            {loadingUsers ? (
              <LoadingSkeleton />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(v) => v && handleRoleChange(user.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
