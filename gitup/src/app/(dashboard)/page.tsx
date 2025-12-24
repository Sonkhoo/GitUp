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
    <div className="h-screen bg-background text-foreground flex justify-center items-center overflow-hidden">
      <main className="flex flex-col items-center px-4 sm:px-6 w-full max-w-6xl mx-auto">
        <UserWelcome displayName={displayName} userImage={userImage || undefined} />
        <p className="text-muted-foreground text-center max-w-md mt-2">
          Ready to make today count?
        </p>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full max-w-xs sm:max-w-2xl mt-8 md:grid-cols-2 mx-auto">
          {/* Todo Card */}
          <Link href="/todos" className="block w-full">
            <Card className="h-full cursor-pointer group w-full">
              {/* Card content */}
              <CardHeader>
                <CardTitle>
                  <CheckSquare className="inline-block mr-2" />
                  Todos
                </CardTitle>
                <CardDescription>
                  Stay organized and productive by managing your tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                View and manage your to-do list.
              </CardContent>
            </Card>
          </Link>

          {/* Habits Card */}
          <Link href="/habits" className="block w-full">
            <Card className="h-full cursor-pointer group w-full">
              <CardHeader>
                <CardTitle>
                  <Flame className="inline-block mr-2" />
                  Habits
                </CardTitle>
                <CardDescription>
                  Build and track your daily habits for lasting change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                View and manage your habit tracker.
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}