// This file will re-export generated APIs once the client is generated.
// Run `pnpm run generate` in this package after exporting the OpenAPI spec.
//
// Usage:
//   import { createApiClient } from '@lunch/api-client';
//   const api = createApiClient('http://localhost:3001/api');

export function createApiClient(basePath: string, fetchFn?: typeof fetch) {
  const defaultFetch = fetchFn ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string> },
  ): Promise<T> {
    const url = new URL(`${basePath}${path}`);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) url.searchParams.set(key, value);
      }
    }

    const res = await defaultFetch(url.toString(), {
      method,
      headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
      throw new ApiError(res.status, error.message ?? res.statusText);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    users: {
      list: () => request<unknown[]>('GET', '/users'),
      me: () => request<unknown>('GET', '/users/me'),
      updateMe: (body: { name?: string; avatarUrl?: string }) =>
        request<unknown>('PATCH', '/users/me', { body }),
      updateRole: (id: string, body: { role: string }) =>
        request<unknown>('PATCH', `/users/${id}/role`, { body }),
    },
    orders: {
      create: (body: { title: string }) =>
        request<unknown>('POST', '/orders', { body }),
      list: (query?: { status?: string; organizerId?: string; page?: string; limit?: string }) =>
        request<unknown>('GET', '/orders', { query }),
      get: (id: string) => request<unknown>('GET', `/orders/${id}`),
      update: (id: string, body: { title?: string; status?: string }) =>
        request<unknown>('PATCH', `/orders/${id}`, { body }),
      uploadReceipt: (id: string, body: { receiptImageUrl: string }) =>
        request<unknown>('POST', `/orders/${id}/receipt`, { body }),
      parseReceipt: (id: string) =>
        request<unknown>('POST', `/orders/${id}/parse-receipt`),
      reparse: (id: string) =>
        request<unknown>('POST', `/orders/${id}/reparse`),
      addItem: (id: string, body: { description: string; amountCents: number; quantity?: number; assignedToId?: string }) =>
        request<unknown>('POST', `/orders/${id}/items`, { body }),
      updateItem: (id: string, itemId: string, body: { description?: string; amountCents?: number; quantity?: number; assignedToId?: string }) =>
        request<unknown>('PATCH', `/orders/${id}/items/${itemId}`, { body }),
      deleteItem: (id: string, itemId: string) =>
        request<unknown>('DELETE', `/orders/${id}/items/${itemId}`),
      finalize: (id: string) =>
        request<unknown>('POST', `/orders/${id}/finalize`),
    },
    debts: {
      myBalance: () => request<unknown>('GET', '/debts/my-balance'),
      teamLedger: () => request<unknown>('GET', '/debts/team-ledger'),
      list: (query?: { fromUserId?: string; toUserId?: string; type?: string; page?: string; limit?: string }) =>
        request<unknown>('GET', '/debts', { query }),
      createPaymentProof: (body: { toUserId: string; amountCents: number; imageUrl: string; orderId?: string }) =>
        request<unknown>('POST', '/debts/payment-proof', { body }),
      listPaymentProofs: (query?: { status?: string; fromUserId?: string; toUserId?: string }) =>
        request<unknown>('GET', '/debts/payment-proofs', { query }),
      reviewPaymentProof: (id: string, body: { status: 'APPROVED' | 'REJECTED' }) =>
        request<unknown>('PATCH', `/debts/payment-proofs/${id}/review`, { body }),
    },
    expenses: {
      create: (body: { title: string; description?: string; estimatedAmountCents: number }) =>
        request<unknown>('POST', '/expenses', { body }),
      list: (query?: { status?: string; claimedById?: string; createdById?: string; page?: string; limit?: string }) =>
        request<unknown>('GET', '/expenses', { query }),
      get: (id: string) => request<unknown>('GET', `/expenses/${id}`),
      claim: (id: string) => request<unknown>('POST', `/expenses/${id}/claim`),
      uploadReceipt: (id: string, body: { receiptImageUrl: string; actualAmountCents: number }) =>
        request<unknown>('POST', `/expenses/${id}/receipt`, { body }),
      reimburse: (id: string) => request<unknown>('POST', `/expenses/${id}/reimburse`),
    },
    dashboard: {
      get: () => request<unknown>('GET', '/dashboard'),
    },
    uploads: {
      upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await defaultFetch(`${basePath}/uploads`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!res.ok) throw new ApiError(res.status, 'Upload failed');
        return res.json() as Promise<{ url: string }>;
      },
    },
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiClient = ReturnType<typeof createApiClient>;
