'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@web/lib/api';
import { useSession } from '@web/lib/auth-client';
import { PageHeader } from '@web/components/shared/page-header';
import { StatusBadge } from '@web/components/shared/status-badge';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { EmptyState } from '@web/components/shared/empty-state';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Textarea } from '@web/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@web/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@web/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@web/components/ui/table';
import { Plus, Receipt } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  status: string;
  estimatedAmountCents: number;
  actualAmountCents: number | null;
  createdBy: { id: string; name: string };
  claimedBy: { id: string; name: string } | null;
}

export default function ExpensesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const isManager = session?.user && ['MANAGER', 'ADMIN'].includes((session.user as unknown as { role: string }).role);

  useEffect(() => {
    let cancelled = false;
    const query: Record<string, string> = {};
    if (tab !== 'all') query.status = tab;
    api.expenses.list(query).then((res) => {
      if (cancelled) return;
      setExpenses((res as { items: Expense[] }).items);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  const handleCreate = async () => {
    if (!title.trim() || !amount) return;
    setCreating(true);
    const expense = (await api.expenses.create({
      title,
      description: description || undefined,
      estimatedAmountCents: Math.round(parseFloat(amount) * 100),
    })) as Expense;
    setCreating(false);
    setDialogOpen(false);
    setTitle('');
    setDescription('');
    setAmount('');
    router.push(`/expenses/${expense.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Office expense requests"
        action={
          isManager ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Request</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Expense Request</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g. Buy coffee" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Amount (EUR)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <Button onClick={handleCreate} disabled={creating || !title.trim() || !amount} className="w-full">
                    {creating ? 'Creating...' : 'Create Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="CLAIMED">My Claims</TabsTrigger>
          <TabsTrigger value="REIMBURSED">Reimbursed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <LoadingSkeleton />
      ) : expenses.length === 0 ? (
        <EmptyState icon={Receipt} message="No expenses found" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Actual</TableHead>
                <TableHead className="hidden sm:table-cell">Claimed By</TableHead>
                <TableHead className="hidden sm:table-cell">Created By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id} className="cursor-pointer" onClick={() => router.push(`/expenses/${exp.id}`)}>
                  <TableCell className="font-medium">
                    <Link href={`/expenses/${exp.id}`} className="hover:underline">{exp.title}</Link>
                  </TableCell>
                  <TableCell className="text-right"><MoneyDisplay cents={exp.estimatedAmountCents} /></TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {exp.actualAmountCents ? <MoneyDisplay cents={exp.actualAmountCents} /> : '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{exp.claimedBy?.name ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{exp.createdBy.name}</TableCell>
                  <TableCell><StatusBadge status={exp.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
