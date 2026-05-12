import { AuthHomeClient } from "@/components/auth/AuthHomeClient";
import { fetchMe } from "@/feature/auth/api/server/me";

export default async function Home() {
  const me = await fetchMe();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <AuthHomeClient me={me} />
      </main>
    </div>
  );
}
