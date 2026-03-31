import { Badge } from '@web/components/ui/badge';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  RECEIPT_UPLOADED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  ITEMS_ASSIGNED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  CLOSED: 'bg-green-500/10 text-green-500 border-green-500/20',
  CLAIMED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  REIMBURSED: 'bg-green-500/10 text-green-500 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
  PAID: 'bg-green-500/10 text-green-500 border-green-500/20',
  DEFERRED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] ?? '';
  return (
    <Badge variant="outline" className={colorClass}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
