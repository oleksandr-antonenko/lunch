'use client';

import { useEffect, useState, use } from 'react';
import { api } from '@web/lib/api';
import { useSession } from '@web/lib/auth-client';
import { PageHeader } from '@web/components/shared/page-header';
import { MoneyDisplay } from '@web/components/shared/money-display';
import { ImageUpload } from '@web/components/shared/image-upload';
import { LoadingSkeleton } from '@web/components/shared/loading-skeleton';
import { Button } from '@web/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@web/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@web/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@web/components/ui/alert-dialog';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  description: string;
  amountCents: number;
  quantity: number;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
}

interface Order {
  id: string;
  title: string;
  status: string;
  organizerId: string;
  receiptImageUrl: string | null;
  totalAmountCents: number;
  organizer: { id: string; name: string };
  items: OrderItem[];
}

interface User {
  id: string;
  name: string;
}

const STEPS = ['OPEN', 'RECEIPT_UPLOADED', 'ITEMS_ASSIGNED', 'CLOSED'];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isOrganizer = session?.user?.id === order?.organizerId;

  const fetchOrder = () => {
    api.orders.get(id).then((o) => {
      setOrder(o as Order);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    api.users.list().then((u) => setUsers(u as User[]));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadReceipt = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.uploads.upload(file);
      await api.orders.uploadReceipt(id, { receiptImageUrl: url });
      fetchOrder();
      toast.success('Receipt uploaded');
    } catch {
      toast.error('Failed to upload receipt');
    }
    setUploading(false);
  };

  const handleParseReceipt = async () => {
    setParsing(true);
    try {
      await api.orders.parseReceipt(id);
      fetchOrder();
      toast.success('Receipt parsed successfully');
    } catch {
      toast.error('Failed to parse receipt');
    }
    setParsing(false);
  };

  const handleAssignItem = async (itemId: string, userId: string) => {
    await api.orders.updateItem(id, itemId, { assignedToId: userId });
    fetchOrder();
  };

  const handleDeleteItem = async (itemId: string) => {
    await api.orders.deleteItem(id, itemId);
    fetchOrder();
  };

  const handleAddItem = async () => {
    await api.orders.addItem(id, { description: 'New item', amountCents: 0, quantity: 1 });
    fetchOrder();
  };

  const handleFinalize = async () => {
    try {
      await api.orders.finalize(id);
      fetchOrder();
      toast.success('Order finalized');
    } catch {
      toast.error('Failed to finalize order');
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!order) return <p className="text-muted-foreground">Order not found</p>;

  const currentStep = STEPS.indexOf(order.status);
  const allAssigned = order.items.length > 0 && order.items.every((i) => i.assignedToId);
  const runningTotal = order.items.reduce((sum, i) => sum + i.amountCents * i.quantity, 0);

  return (
    <div>
      <PageHeader title={order.title} description={`Organized by ${order.organizer.name}`} />

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

      {/* OPEN: Upload receipt */}
      {order.status === 'OPEN' && isOrganizer && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Upload Receipt</CardTitle></CardHeader>
          <CardContent>
            <ImageUpload onUpload={handleUploadReceipt} />
            {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
          </CardContent>
        </Card>
      )}

      {/* RECEIPT_UPLOADED: Parse */}
      {order.status === 'RECEIPT_UPLOADED' && isOrganizer && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Receipt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {order.receiptImageUrl && (
              <img src={order.receiptImageUrl} alt="Receipt" className="max-h-64 rounded border" />
            )}
            <Button onClick={handleParseReceipt} disabled={parsing}>
              {parsing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Parsing...</> : 'Parse Receipt with AI'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items table */}
      {order.items.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Items</CardTitle>
            {isOrganizer && order.status !== 'CLOSED' && (
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />Add Item
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Assigned To</TableHead>
                    {isOrganizer && order.status !== 'CLOSED' && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">
                        <MoneyDisplay cents={item.amountCents} />
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell>
                        {order.status === 'CLOSED' ? (
                          item.assignedTo?.name ?? '—'
                        ) : isOrganizer ? (
                          <Select
                            value={item.assignedToId ?? ''}
                            onValueChange={(v) => handleAssignItem(item.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          item.assignedTo?.name ?? '—'
                        )}
                      </TableCell>
                      {isOrganizer && order.status !== 'CLOSED' && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-3">
              <p className="text-sm font-medium">
                Total: <MoneyDisplay cents={runningTotal} />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finalize button */}
      {isOrganizer && order.status !== 'CLOSED' && order.items.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button disabled={!allAssigned} className="w-full sm:w-auto" />}>
            Finalize Order
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalize Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create debt records for each person. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalize}>Finalize</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Closed: receipt image */}
      {order.status === 'CLOSED' && order.receiptImageUrl && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Receipt</CardTitle></CardHeader>
          <CardContent>
            <img src={order.receiptImageUrl} alt="Receipt" className="max-h-64 rounded border" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
