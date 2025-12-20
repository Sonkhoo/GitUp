import { SignInButtons } from "@/components/auth/SignInButtons";
import Image from "next/image";

export default function Login() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <Image 
            src="/gitup_light.PNG" 
            alt="GitUp Logo" 
            width={64} 
            height={64}
            className="h-16 w-auto" 
            priority
          />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">GitUp</h1>
        <p className="text-muted-foreground text-center mb-8">
          A contribution graph for your life
        </p>

        <SignInButtons />

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
