import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon?: LucideIcon;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
      <p className="text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
