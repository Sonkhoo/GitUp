'use client';

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function ThemeLogo({ width = 64, height = 64, className }: ThemeLogoProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light logo before mount to avoid hydration mismatch
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/gitup_dark.PNG' : '/gitup_light.PNG';

  return (
    <Image 
      src={logoSrc}
      alt="GitUp Logo" 
      width={width} 
      height={height}
      className={className}
      priority
    />
  );
}