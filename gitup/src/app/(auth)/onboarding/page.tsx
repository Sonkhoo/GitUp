import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { checkOnboardingStatus } from "@/lib/onboarding";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user already completed onboarding
  const { needsOnboarding } = await checkOnboardingStatus(session.user.id);

  if (!needsOnboarding) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to GitUp 👋</h1>
          <p className="text-muted-foreground">
            Let's get you set up. What should we call you?
          </p>
        </div>

        <Card className="p-8">
          <OnboardingForm userId={session.user.id} />
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can always change this later in settings.
        </p>
      </div>
    </div>
  );
}
