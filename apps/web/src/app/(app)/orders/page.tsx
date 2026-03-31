'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@web/lib/api';
import { PageHeader } from '@web/components/shared/page-header';
import { StatusBadge } from '@web/components/shared/status-badge';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { EmptyState } from '@web/components/shared/empty-state';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@web/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@web/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@web/components/ui/table';
import { Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  title: string;
  status: string;
  totalAmountCents: number;
  createdAt: string;
  organizer: { id: string; name: string };
  _count: { items: number };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query: Record<string, string> = {};
    if (tab !== 'all') query.status = tab;
    api.orders.list(query).then((res) => {
      if (cancelled) return;
      setOrders((res as { items: Order[] }).items);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const order = (await api.orders.create({ title })) as Order;
    setCreating(false);
    setDialogOpen(false);
    setTitle('');
    router.push(`/orders/${order.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage lunch orders"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Order</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Friday Pizza Order"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating || !title.trim()} className="w-full">
                  {creating ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="CLOSED">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <LoadingSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} message="No orders found" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Organizer</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${order.id}`} className="hover:underline">{order.title}</Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{order.organizer.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{order._count.items}</TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay cents={order.totalAmountCents} />
                  </TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
