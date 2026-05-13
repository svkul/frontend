"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
    router.refresh();
  }, [router]);

  return <p className="p-6">Redirecting...</p>;
}
