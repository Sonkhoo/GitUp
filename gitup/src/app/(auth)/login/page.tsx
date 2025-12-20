import { SignInButtons } from "@/components/auth/SignInButtons";
import { ThemeLogo } from "@/components/ui/theme-logo";

export default function Login() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ThemeLogo width={64} height={64} className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-2">GitUp</h1>
          <p className="text-muted-foreground">
            A contribution graph for your life
          </p>
        </div>

        <SignInButtons />

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
