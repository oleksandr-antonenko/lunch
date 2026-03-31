import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@lunch/api-client';

export function useApiError() {
  const router = useRouter();

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            router.push('/sign-in');
            return;
          case 403:
            toast.error('Insufficient permissions');
            return;
          case 422:
            toast.error(`Validation error: ${error.message}`);
            return;
          default:
            toast.error(error.message || 'Something went wrong');
            return;
        }
      }

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Something went wrong');
      }
    },
    [router],
  );

  return { handleError };
}
