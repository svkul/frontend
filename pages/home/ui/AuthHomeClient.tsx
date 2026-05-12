import { GoogleLogin } from "@/feature/auth/ui/google/Google";
import { LogOut } from "@/feature/auth/ui/log-out/LogOut";
import type { MeResponse } from "@/feature/auth/models/auth";
import { IsProtected } from "@/feature/auth/ui/is-protected/IsProtected";

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
      <IsProtected />
      <LogOut />
    </div>
  );
};
