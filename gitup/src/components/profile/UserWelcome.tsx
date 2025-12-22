import Image from "next/image";

interface UserWelcomeProps {
  displayName: string;
  userImage?: string;
}

export function UserWelcome({ displayName, userImage }: UserWelcomeProps) {
  return (
    <div className="flex flex-col items-center mb-12">
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
      <h1 className="text-3xl font-bold mb-2">
        Welcome, {displayName}! 👋
      </h1>
    </div>
  );
}