'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingFormProps {
  userId: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label 
          htmlFor="displayName" 
          className="block text-sm font-medium text-foreground"
        >
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex Chen"
          autoFocus
          autoComplete="off"
          maxLength={50}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg 
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                     transition-all"
        />
        <p className="text-xs text-muted-foreground">
          This is how you'll appear to others
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !displayName.trim()}
        className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg
                   border-0 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {isLoading ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}
