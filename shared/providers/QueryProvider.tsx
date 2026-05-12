"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  clearUnauthorizedHandler,
  registerUnauthorizedHandler,
} from "@/utils/api/client/bff";

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
      await fetch("/api/auth/logout", {
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
