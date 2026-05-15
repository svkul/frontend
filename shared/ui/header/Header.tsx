import Image from "next/image";
import Link from "next/link";

import { LogOut } from "@/feature/auth/ui/log-out/LogOut";
import { getServerUser } from "@/shared/api/server/get-server-user";
import { Button } from "@/shared/ui/shadcn/button";

export const Header = async () => {
  const me = await getServerUser();

  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/next.svg" alt="Logo" width={128} height={26} loading="eager" />
      </Link>

      {me ? (
        <div className="flex items-center gap-2">
          <p>{me.user.name ?? me.user.email}</p>
          <LogOut />
        </div>
      ) : (
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </header>
  );
};