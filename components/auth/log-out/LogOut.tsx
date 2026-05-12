"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { logoutClient } from "@/lib/api/client/auth.client";

export const LogOut = () => {
  const router = useRouter();
  const { mutate, isPending, isError } = useMutation({
    mutationFn: logoutClient,
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={() => mutate()} disabled={isPending}>
        {isPending ? "Logging out..." : "Log Out"}
      </button>

      {isError ? <p className="text-red-500">Unable to sign out</p> : null}
    </div>
  );
};
