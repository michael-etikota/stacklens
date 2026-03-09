import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
  ({ size = 32, className }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(262, 80%, 55%)" />
            <stop offset="1" stopColor="hsl(262, 80%, 40%)" />
          </linearGradient>
          <linearGradient id="logoAccent" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(25, 95%, 53%)" />
            <stop offset="1" stopColor="hsl(25, 95%, 45%)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoBg)" />
        <rect x="16" y="18" width="32" height="6" rx="3" fill="white" opacity="0.95" />
        <rect x="20" y="29" width="28" height="6" rx="3" fill="white" opacity="0.7" />
        <rect x="24" y="40" width="24" height="6" rx="3" fill="white" opacity="0.45" />
        <circle cx="44" cy="44" r="8" fill="url(#logoAccent)" opacity="0.9" />
        <circle cx="44" cy="44" r="4" fill="white" opacity="0.3" />
      </svg>
    );
  }
);

Logo.displayName = "Logo";
