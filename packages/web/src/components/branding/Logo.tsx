import { textSizeClasses } from "@lib/sizing";
import { cn } from "@lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { BaseHTMLAttributes, forwardRef } from "react";

const logoVariants = cva("inline-flex items-center font-catamaran", {
  variants: {
    size: {
      "2xs": textSizeClasses["2xs"],
      xs: textSizeClasses.xs,
      sm: textSizeClasses.sm,
      md: textSizeClasses.md,
      lg: textSizeClasses.lg,
      xl: textSizeClasses.xl,
      "2xl": textSizeClasses["2xl"],
      "3xl": textSizeClasses["3xl"],
      "4xl": textSizeClasses["4xl"],
      "5xl": textSizeClasses["5xl"],
      "6xl": textSizeClasses["6xl"],
      "7xl": textSizeClasses["7xl"],
      "8xl": textSizeClasses["8xl"],
    },
    colorscheme: {
      light: "text-white",
      dark: "text-slate-800",
    },
  },
  defaultVariants: {
    size: "md",
    colorscheme: "light",
  },
});

export interface LogoProps
  extends BaseHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof logoVariants> {}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size, colorscheme, ...props }, ref) => {
    return (
      <div
        className={cn(logoVariants({ size, colorscheme, className }))}
        ref={ref}
        {...props}
      >
        <span>revelations</span>
        <span className="text-blue-300">AI</span>
      </div>
    );
  }
);
Logo.displayName = "Logo";

export { Logo, logoVariants };
