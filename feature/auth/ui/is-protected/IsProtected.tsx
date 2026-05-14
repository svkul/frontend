"use client";

import { useMutation } from "@tanstack/react-query";

import { protectedClient } from "../../api/client/auth.client";
import { ApiError } from "@/shared/api/client/api-client";

export const IsProtected = () => {
  const { mutate, reset, isPending, isError } = useMutation({
    mutationFn: protectedClient,
    onSuccess: () => {
      console.log("success");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        reset();
      }
    },
  });

  return (
    <button
      className="flex items-center gap-2"
      type="button"
      onClick={() => mutate()}
    >
      {isPending ? "Loading..." : "Is protected"}
      {isError ? "Error" : null}
    </button>
  );
};