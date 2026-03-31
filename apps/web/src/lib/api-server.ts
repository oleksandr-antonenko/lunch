import { cookies } from 'next/headers';
import { createApiClient } from '@lunch/api-client';

export async function getServerApi() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return createApiClient(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    (url, init) =>
      fetch(url, {
        ...init,
        headers: {
          ...Object.fromEntries(
            new Headers(init?.headers as HeadersInit).entries(),
          ),
          cookie: cookieHeader,
        },
      }),
  );
}
