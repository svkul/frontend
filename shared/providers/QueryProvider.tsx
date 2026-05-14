"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { getBackendBaseUrl } from "@/shared/lib/backend-url";
import {
  clearUnauthorizedHandler,
  registerUnauthorizedHandler,
} from "@/shared/api/client/api-client";

type Props = {
  children: ReactNode;
};

export const QueryProvider = ({ children }: Props) => {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    registerUnauthorizedHandler(async () => {
      await fetch(`${getBackendBaseUrl()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(() => undefined);

      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      router.refresh();
    });

    return () => {
      clearUnauthorizedHandler();
    };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
