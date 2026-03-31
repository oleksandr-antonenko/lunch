'use client';

import { useEffect, useState } from 'react';
import { api } from '@web/lib/api';
import { PageHeader } from '@web/components/shared/page-header';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { StatusBadge } from '@web/components/shared/status-badge';
import { ImageUpload } from '@web/components/shared/image-upload';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { EmptyState } from '@web/components/shared/empty-state';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Card, CardContent } from '@web/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@web/components/ui/dialog';
import { Wallet } from 'lucide-react';
import { cn } from '@web/lib/utils';
import { toast } from 'sonner';

interface BalanceData {
  totalOwed: number;
  totalOwedToMe: number;
  netBalance: number;
  perUser: { userId: string; name: string; balance: number }[];
}

interface PaymentProof {
  id: string;
  amountCents: number;
  imageUrl: string;
  status: string;
  createdAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

export default function DebtsPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState<{ userId: string; name: string; amount: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      api.debts.myBalance(),
      api.debts.listPaymentProofs(),
    ]).then(([b, p]) => {
      setBalance(b as BalanceData);
      setProofs(p as PaymentProof[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (file: File) => {
    if (!payDialog) return;
    setSubmitting(true);
    try {
      const { url } = await api.uploads.upload(file);
      await api.debts.createPaymentProof({
        toUserId: payDialog.userId,
        amountCents: Math.round(parseFloat(payAmount) * 100),
        imageUrl: url,
      });
      toast.success('Payment proof submitted');
      setPayDialog(null);
      fetchData();
    } catch {
      toast.error('Failed to submit payment proof');
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSkeleton />;
  if (!balance) return <p className="text-muted-foreground">Failed to load</p>;

  return (
    <div>
      <PageHeader title="Debts" description="Track what you owe and what others owe you" />

      <Tabs defaultValue="balance">
        <TabsList className="mb-4">
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="proofs">Payment Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <MoneyDisplay
                  cents={Math.abs(balance.netBalance)}
                  className={cn(
                    'text-4xl font-bold',
                    balance.netBalance >= 0 ? 'text-green-500' : 'text-red-500',
                  )}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {balance.netBalance >= 0 ? 'People owe you' : 'You owe'}
                </p>
              </div>
            </CardContent>
          </Card>

          {balance.perUser.length === 0 ? (
            <EmptyState icon={Wallet} message="No outstanding debts" />
          ) : (
            <div className="space-y-3">
              {balance.perUser.map((u) => (
                <Card key={u.userId}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoneyDisplay
                        cents={Math.abs(u.balance)}
                        className={cn('font-medium', u.balance >= 0 ? 'text-green-500' : 'text-red-500')}
                      />
                      {u.balance < 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayDialog({ userId: u.userId, name: u.name, amount: Math.abs(u.balance) });
                            setPayAmount((Math.abs(u.balance) / 100).toFixed(2));
                          }}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proofs">
          {proofs.length === 0 ? (
            <EmptyState icon={Wallet} message="No payment proofs" />
          ) : (
            <div className="space-y-3">
              {proofs.map((proof) => (
                <Card key={proof.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">{proof.fromUser.name} → {proof.toUser.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(proof.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoneyDisplay cents={proof.amountCents} className="text-sm font-medium" />
                      <StatusBadge status={proof.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay {payDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Amount (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Screenshot</Label>
              <ImageUpload onUpload={handlePay} />
            </div>
            {submitting && <p className="text-sm text-muted-foreground">Submitting...</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
