import api from '@/lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useToast } from '@/hooks/useToast';

// Generic fetch hook
export function useApiQuery<T>(
  key: string[],
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, AxiosError>({
    queryKey: [...key, params],
    queryFn: async () => {
      const res = await api.get<{ data: T }>(url, { params });
      return res.data.data;
    },
    ...options,
  });
}

// Generic mutation hook with toast feedback
export function useApiMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, AxiosError, TVariables> & {
    successMessage?: string;
    invalidateKeys?: string[][];
  }
) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation<TData, AxiosError, TVariables>({
    mutationFn,
    onSuccess: (data, vars) => {
      if (options?.successMessage) toast({ title: options.successMessage });
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(k => qc.invalidateQueries({ queryKey: k }));
      }
      options?.onSuccess?.(data, vars, undefined as never);
    },
    onError: (err, vars) => {
      const msg = (err.response?.data as { error?: string })?.error || err.message;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      options?.onError?.(err, vars, undefined as never);
    },
  });
}
