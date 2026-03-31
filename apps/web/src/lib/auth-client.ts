import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
// @ts-expect-error -- better-auth type references non-portable module paths
export const useSession: () => {
  data: { user: { id: string; name: string; email: string; emailVerified: boolean; image?: string | null }; session: unknown } | null;
  isPending: boolean;
  error: unknown;
} = authClient.useSession;
