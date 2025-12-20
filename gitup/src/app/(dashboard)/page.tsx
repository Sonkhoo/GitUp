import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckSquare, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const displayName = session.user.name || "there";
  const userImage = session.user.image;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with theme toggle */}
      <header className="flex items-center justify-end p-6">
        <ModeToggle />
      </header>

      {/* Main content - centered */}
      <main className="flex flex-col items-center px-6 pb-12">
        {/* Profile section */}
        <div className="flex flex-col items-center mb-12">
          {/* Profile image */}
          <div className="relative mb-6">
            {userImage ? (
              <Image
                src={userImage}
                alt={displayName}
                width={120}
                height={120}
                className="rounded-full border-4 border-primary/20 shadow-lg"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center">
                <span className="text-4xl font-semibold text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Welcome message */}
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            Ready to make today count?
          </p>
        </div>

        {/* Cards section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Todo Card */}
          <Link href="/todos" className="block">
            <Card className="h-full cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <CardTitle>Todos</CardTitle>
                </div>
                <CardDescription>
                  Manage your daily tasks and watch your contribution graph grow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-primary/20" />
                    <div className="w-3 h-3 rounded-sm bg-primary/40" />
                    <div className="w-3 h-3 rounded-sm bg-primary/60" />
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                  </div>
                  <span>Track your progress</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Habits Card */}
          <Link href="/habits" className="block">
            <Card className="h-full cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Flame className="w-6 h-6" />
                  </div>
                  <CardTitle>Habits</CardTitle>
                </div>
                <CardDescription>
                  Build consistency with daily habits and maintain your streaks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lg">🔥</span>
                  <span>Keep your streak alive</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}