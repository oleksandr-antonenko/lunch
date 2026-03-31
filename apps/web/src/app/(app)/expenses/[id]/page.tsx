'use client';

import { useEffect, useState, use } from 'react';
import { api } from '@web/lib/api';
import { useSession } from '@web/lib/auth-client';
import { PageHeader } from '@web/components/shared/page-header';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { ImageUpload } from '@web/components/shared/image-upload';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { toast } from 'sonner';

interface Expense {
  id: string;
  title: string;
  description: string | null;
  status: string;
  estimatedAmountCents: number;
  actualAmountCents: number | null;
  receiptImageUrl: string | null;
  reimbursedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  claimedBy: { id: string; name: string; email: string } | null;
}

const STEPS = ['OPEN', 'CLAIMED', 'RECEIPT_UPLOADED', 'REIMBURSED'];

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualAmount, setActualAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = session?.user?.id;
  const userRole = (session?.user as unknown as { role?: string } | undefined)?.role;
  const isManager = userRole && ['MANAGER', 'ADMIN'].includes(userRole);
  const isClaimant = expense?.claimedBy?.id === userId;

  const fetchExpense = () => {
    api.expenses.get(id).then((e) => {
      const exp = e as Expense;
      setExpense(exp);
      if (exp.actualAmountCents) setActualAmount((exp.actualAmountCents / 100).toFixed(2));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchExpense(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = async () => {
    try {
      await api.expenses.claim(id);
      fetchExpense();
      toast.success('Expense claimed');
    } catch { toast.error('Failed to claim'); }
  };

  const handleUploadReceipt = async (file: File) => {
    if (!actualAmount) { toast.error('Enter the actual amount first'); return; }
    setSubmitting(true);
    try {
      const { url } = await api.uploads.upload(file);
      await api.expenses.uploadReceipt(id, {
        receiptImageUrl: url,
        actualAmountCents: Math.round(parseFloat(actualAmount) * 100),
      });
      fetchExpense();
      toast.success('Receipt uploaded');
    } catch { toast.error('Failed to upload'); }
    setSubmitting(false);
  };

  const handleReimburse = async () => {
    try {
      await api.expenses.reimburse(id);
      fetchExpense();
      toast.success('Marked as reimbursed');
    } catch { toast.error('Failed to reimburse'); }
  };

  if (loading) return <LoadingSkeleton />;
  if (!expense) return <p className="text-muted-foreground">Expense not found</p>;

  const currentStep = STEPS.indexOf(expense.status);

  return (
    <div>
      <PageHeader title={expense.title} description={expense.description ?? undefined} />

      {/* Status stepper */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-8 px-3 rounded-full text-xs font-medium ${
              i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step.replace(/_/g, ' ')}
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Info card */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created by</span>
            <span>{expense.createdBy.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated</span>
            <MoneyDisplay cents={expense.estimatedAmountCents} />
          </div>
          {expense.actualAmountCents && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual</span>
              <MoneyDisplay cents={expense.actualAmountCents} />
            </div>
          )}
          {expense.claimedBy && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claimed by</span>
              <span>{expense.claimedBy.name}</span>
            </div>
          )}
          {expense.reimbursedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reimbursed</span>
              <span>{new Date(expense.reimbursedAt).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPEN: Claim button */}
      {expense.status === 'OPEN' && (
        <Button onClick={handleClaim} className="w-full sm:w-auto">Claim This Expense</Button>
      )}

      {/* CLAIMED: Upload receipt */}
      {expense.status === 'CLAIMED' && isClaimant && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upload Receipt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Actual Amount (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
              />
            </div>
            <ImageUpload onUpload={handleUploadReceipt} />
            {submitting && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </CardContent>
        </Card>
      )}

      {/* RECEIPT_UPLOADED: Preview + reimburse */}
      {expense.status === 'RECEIPT_UPLOADED' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Receipt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {expense.receiptImageUrl && (
              <img src={expense.receiptImageUrl} alt="Receipt" className="max-h-64 rounded border" />
            )}
            {isManager && (
              <Button onClick={handleReimburse}>Mark as Reimbursed</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
