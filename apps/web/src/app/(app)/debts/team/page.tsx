'use client';

import { useEffect, useState } from 'react';
import { api } from '@web/lib/api';
import { PageHeader } from '@web/components/shared/page-header';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { StatusBadge } from '@web/components/shared/status-badge';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { EmptyState } from '@web/components/shared/empty-state';
import { Button } from '@web/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { cn } from '@web/lib/utils';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

interface LedgerData {
  users: { id: string; name: string }[];
  matrix: { fromUserId: string; fromUserName: string; toUserId: string; toUserName: string; balance: number }[];
}

interface PaymentProof {
  id: string;
  amountCents: number;
  imageUrl: string;
  status: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

export default function TeamLedgerPage() {
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.debts.teamLedger(),
      api.debts.listPaymentProofs({ status: 'PENDING' }),
    ]).then(([l, p]) => {
      setLedger(l as LedgerData);
      setProofs(p as PaymentProof[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleReview = async (proofId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.debts.reviewPaymentProof(proofId, { status });
      toast.success(`Payment ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error('Failed to review payment');
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!ledger) return <p className="text-muted-foreground">Failed to load</p>;

  return (
    <div>
      <PageHeader title="Team Ledger" description="Manager view of all debts" />

      {ledger.matrix.length === 0 ? (
        <EmptyState icon={Users} message="No debts in the system" />
      ) : (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Debt Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="space-y-2">
                {ledger.matrix.map((entry) => (
                  <div key={`${entry.fromUserId}-${entry.toUserId}`} className="flex items-center justify-between p-2 rounded border">
                    <span className="text-sm">
                      <span className="font-medium">{entry.fromUserName}</span>
                      {' → '}
                      <span className="font-medium">{entry.toUserName}</span>
                    </span>
                    <MoneyDisplay
                      cents={Math.abs(entry.balance)}
                      className={cn('text-sm font-medium', entry.balance > 0 ? 'text-red-500' : 'text-green-500')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending proofs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pending Payment Proofs</CardTitle></CardHeader>
        <CardContent>
          {proofs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending proofs</p>
          ) : (
            <div className="space-y-3">
              {proofs.map((proof) => (
                <div key={proof.id} className="flex items-center justify-between p-3 rounded border">
                  <div>
                    <p className="text-sm font-medium">{proof.fromUser.name} → {proof.toUser.name}</p>
                    <MoneyDisplay cents={proof.amountCents} className="text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={proof.status} />
                    <Button size="sm" variant="outline" onClick={() => handleReview(proof.id, 'APPROVED')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReview(proof.id, 'REJECTED')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
