"use client";

import { GoogleLogin } from "@/components/auth/google/Google";
import { LogOut } from "@/components/auth/log-out/LogOut";
import type { MeResponse } from "@/lib/api/types/auth";

type Props = {
  me: MeResponse | null;
};

export const AuthHomeClient = ({ me }: Props) => {
  if (!me) {
    return <GoogleLogin />;
  }

  return (
    <div>
      <p>Hello, {me.user.name ?? me.user.email}</p>
      <LogOut />
    </div>
  );
};
