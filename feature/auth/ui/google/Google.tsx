"use client";

import Image from "next/image";

import { Button } from "@/shared/ui/shadcn/button";

export const GoogleLogin = () => {
  const handleSignInWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Button
      className="flex items-center gap-2"
      type="button"
      onClick={handleSignInWithGoogle}
    >
      <Image src="/google.png" alt="Google" width={20} height={20} />
      Login with Google
    </Button>
  );
};