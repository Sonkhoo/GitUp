import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ModeToggle } from "@/components/ui/theme-toggle";

export default async function Dashboard() {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/login");
    }
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>
        <ModeToggle />
      </div>
    </div>
  );
}