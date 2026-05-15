"use client";

import { useQuery } from "@tanstack/react-query";

import { meClient } from "../../api/client/auth.client";

export const IsProtected = () => {
  const { refetch, isFetching, isError, data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: meClient,
    enabled: false,
  });

  return (
    <button
      className="flex items-center gap-2"
      type="button"
      onClick={() => void refetch()}
    >
      {isFetching ? "Loading..." : data ? `Hi, ${data.user.name ?? data.user.email}` : "Check auth"}
      {isError ? " — not authenticated" : null}
    </button>
  );
};