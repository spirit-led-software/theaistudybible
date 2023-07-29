import { cn } from "@lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { BaseHTMLAttributes, forwardRef } from "react";

const bouncingDotsVariants = cva("rounded-full animate-bounce", {
  variants: {
    size: {
      sm: "h-1 w-1 mx-0.5",
      md: "h-2 w-2 mx-1",
      lg: "h-4 w-4 mx-2",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface BouncingDotsProps
  extends BaseHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bouncingDotsVariants> {}

const BouncingDots = forwardRef<HTMLDivElement, BouncingDotsProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div className="flex flex-row" ref={ref} {...props}>
        <div className={cn(bouncingDotsVariants({ size, className }))}></div>
        <div
          className={cn(
            bouncingDotsVariants({ size, className }),
            "animation-delay-200"
          )}
        ></div>
        <div
          className={cn(
            bouncingDotsVariants({ size, className }),
            "animation-delay-400"
          )}
        ></div>
      </div>
    );
  }
);
BouncingDots.displayName = "BouncingDots";

export { BouncingDots, bouncingDotsVariants };
