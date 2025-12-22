import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckSquare, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserWelcome } from "@/components/profile/UserWelcome";
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
    <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
      {/* Main content - centered */}
      <main className="flex flex-col items-center px-6 pb-4 pt-8">
        {/* Profile section */}
        <UserWelcome displayName={displayName} userImage={userImage || undefined} />
              <p className="text-muted-foreground text-center max-w-md">
        Ready to make today count?
      </p>
        {/* Cards section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
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