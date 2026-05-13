import Image from "next/image";

import { fetchMe } from "@/storinki/home/api/server/me";

import { GoogleLogin } from "@/feature/auth/ui/google/Google";
import { LogOut } from "@/feature/auth/ui/log-out/LogOut";


export const Header = async () => {
  const me = await fetchMe();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image src="/next.svg" alt="Logo" width={128} height={26} />
      </div>

      {me ? (
        <div className="flex items-center gap-2">
          <p>{me.user.name ?? me.user.email}</p>
          <LogOut />
        </div>
      ) : (
        <GoogleLogin />
      )}
    </header>
  );
};