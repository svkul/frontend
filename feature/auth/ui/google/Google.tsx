"use client";

import Image from "next/image";

export const GoogleLogin = () => {
  const handleSignInWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <button
      className="flex items-center gap-2"
      type="button"
      onClick={handleSignInWithGoogle}
    >
      <Image src="/google.png" alt="Google" width={20} height={20} />
      Login with Google
    </button>
  );
};