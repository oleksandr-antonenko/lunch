'use client';

import { useSession, signOut } from '@web/lib/auth-client';
import { ThemeToggle } from '@web/components/theme-toggle';
import { Button } from '@web/components/ui/button';
import { LogOut } from 'lucide-react';

export function AppTopbar() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-2 bg-card">
      <div className="md:hidden text-lg font-semibold">Lunch Tracker</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        {session?.user && (
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/sign-in'; } } })}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
