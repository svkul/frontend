import { IsProtected } from "@/feature/auth/ui/is-protected/IsProtected";

export default function Home() {
  return <div>
    <h1>Home page</h1>

    <IsProtected />
  </div>;
}
