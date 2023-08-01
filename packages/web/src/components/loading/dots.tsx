import { cn } from "@lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { BaseHTMLAttributes, forwardRef } from "react";

const dotsVariants = cva(
  "rounded-full animate-pulse transition duration-700 ease-in-out",
  {
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
  }
);

export interface DotsProps
  extends BaseHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dotsVariants> {}

const Dots = forwardRef<HTMLDivElement, DotsProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div className="flex flex-row" ref={ref} {...props}>
        <div className={cn(dotsVariants({ size, className }))}></div>
        <div
          className={cn(dotsVariants({ size, className }), "delay-500")}
        ></div>
        <div
          className={cn(dotsVariants({ size, className }), "delay-700")}
        ></div>
      </div>
    );
  }
);
Dots.displayName = "Dots";

export { Dots, dotsVariants };
