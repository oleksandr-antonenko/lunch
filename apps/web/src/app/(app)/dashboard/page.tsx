'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@web/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { StatusBadge } from '@web/components/shared/status-badge';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { EmptyState } from '@web/components/shared/empty-state';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { ShoppingBag, Wallet, Receipt, Package } from 'lucide-react';
import { cn } from '@web/lib/utils';

interface DashboardData {
  activeOrders: { id: string; title: string; status: string; organizer: { name: string }; _count: { items: number } }[];
  myUnpaidItems: { id: string; description: string; amountCents: number; quantity: number; order: { id: string; title: string } }[];
  myDebts: { totalOwed: number; totalOwedToMe: number; netBalance: number; perUser: { userId: string; name: string; balance: number }[] };
  openExpenseRequests: { id: string; title: string; estimatedAmountCents: number; createdBy: { name: string } }[];
  myPendingReimbursements: { id: string; title: string; actualAmountCents: number | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get().then((d) => {
      setData(d as DashboardData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-muted-foreground">Failed to load dashboard</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Active Orders</CardTitle>
            <Link href="/orders" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            {data.activeOrders.length === 0 ? (
              <EmptyState icon={ShoppingBag} message="No active orders" />
            ) : (
              <div className="space-y-3">
                {data.activeOrders.slice(0, 5).map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{order.title}</p>
                      <p className="text-xs text-muted-foreground">{order.organizer.name} &middot; {order._count.items} items</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">My Unpaid Items</CardTitle>
          </CardHeader>
          <CardContent>
            {data.myUnpaidItems.length === 0 ? (
              <EmptyState icon={Package} message="No unpaid items" />
            ) : (
              <div className="space-y-3">
                {data.myUnpaidItems.slice(0, 5).map((item) => (
                  <Link key={item.id} href={`/orders/${item.order.id}`} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.order.title}</p>
                    </div>
                    <MoneyDisplay cents={item.amountCents * item.quantity} className="text-sm font-medium" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">My Debts</CardTitle>
            <Link href="/debts" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <MoneyDisplay
                cents={Math.abs(data.myDebts.netBalance)}
                className={cn(
                  'text-2xl font-bold',
                  data.myDebts.netBalance >= 0 ? 'text-green-500' : 'text-red-500',
                )}
              />
              <p className="text-xs text-muted-foreground">
                {data.myDebts.netBalance >= 0 ? 'People owe you' : 'You owe'}
              </p>
            </div>
            {data.myDebts.perUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding debts</p>
            ) : (
              <div className="space-y-2">
                {data.myDebts.perUser.slice(0, 5).map((u) => (
                  <div key={u.userId} className="flex items-center justify-between text-sm">
                    <span>{u.name}</span>
                    <MoneyDisplay
                      cents={Math.abs(u.balance)}
                      className={cn(u.balance >= 0 ? 'text-green-500' : 'text-red-500')}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Open Expense Requests</CardTitle>
            <Link href="/expenses" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            {data.openExpenseRequests.length === 0 ? (
              <EmptyState icon={Receipt} message="No open requests" />
            ) : (
              <div className="space-y-3">
                {data.openExpenseRequests.slice(0, 5).map((expense) => (
                  <Link key={expense.id} href={`/expenses/${expense.id}`} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">by {expense.createdBy.name}</p>
                    </div>
                    <MoneyDisplay cents={expense.estimatedAmountCents} className="text-sm" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pending Reimbursements</CardTitle>
          </CardHeader>
          <CardContent>
            {data.myPendingReimbursements.length === 0 ? (
              <EmptyState icon={Wallet} message="No pending reimbursements" />
            ) : (
              <div className="space-y-3">
                {data.myPendingReimbursements.slice(0, 5).map((expense) => (
                  <Link key={expense.id} href={`/expenses/${expense.id}`} className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                    <p className="text-sm font-medium">{expense.title}</p>
                    {expense.actualAmountCents && (
                      <MoneyDisplay cents={expense.actualAmountCents} className="text-sm" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
