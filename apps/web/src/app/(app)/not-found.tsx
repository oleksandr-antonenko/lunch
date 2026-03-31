import Link from 'next/link';
import { Button } from '@web/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
