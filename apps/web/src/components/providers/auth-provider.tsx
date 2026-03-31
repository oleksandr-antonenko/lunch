'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@web/components/ui/tooltip';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
