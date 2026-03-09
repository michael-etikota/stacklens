import * as React from "react";
import { cn } from "@/lib/utils";

export const ShimmerSkeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
);
ShimmerSkeleton.displayName = "ShimmerSkeleton";
