'use client';

import useSWR from 'swr';
import { api } from '@web/lib/api';

// Generic fetcher wrapper for SWR
function fetcher<T>(fn: () => Promise<unknown>): () => Promise<T> {
  return () => fn() as Promise<T>;
}

export function useDashboard() {
  return useSWR('dashboard', fetcher(api.dashboard.get), {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
    refreshInterval: 30000,
  });
}

export function useOrders(query?: Record<string, string>) {
  const key = query ? `orders-${JSON.stringify(query)}` : 'orders';
  return useSWR(key, () => api.orders.list(query), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useOrder(id: string, polling = false) {
  return useSWR(`order-${id}`, () => api.orders.get(id), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    refreshInterval: polling ? 10000 : 0,
  });
}

export function useDebtsBalance() {
  return useSWR('debts-balance', fetcher(api.debts.myBalance), {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function usePaymentProofs(query?: Record<string, string>, polling = false) {
  return useSWR('payment-proofs', () => api.debts.listPaymentProofs(query), {
    revalidateOnFocus: true,
    refreshInterval: polling ? 10000 : 0,
  });
}

export function useExpenses(query?: Record<string, string>) {
  const key = query ? `expenses-${JSON.stringify(query)}` : 'expenses';
  return useSWR(key, () => api.expenses.list(query), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useExpense(id: string) {
  return useSWR(`expense-${id}`, () => api.expenses.get(id), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useUsers() {
  return useSWR('users', fetcher(api.users.list), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}
