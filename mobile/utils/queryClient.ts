import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  // defaultOptions: {
  //   queries: {
  //     retry: 2,
  //     staleTime: 5 * 60 * 1000, // 5 minutes
  //     gcTime: 10 * 60 * 1000,
  //     refetchOnWindowFocus: false,
  //     refetchOnMount: true,
  //     refetchOnReconnect: true,
  //   },
  //   mutations: {
  //     retry: 1,
  //   },
  // },
});