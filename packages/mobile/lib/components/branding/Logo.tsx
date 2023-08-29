import { Text, View } from "@components/Themed";
import { cn } from "@util/class-names";
import { textSizeClasses } from "@util/sizing";
import { VariantProps, cva } from "class-variance-authority";

const logoVariants = cva("font-catamaran", {
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

interface LogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
}

export function Logo({ colorscheme, size, className }: LogoProps) {
  return (
    <View className={cn("flex flex-row")}>
      <Text className={cn(logoVariants({ size, colorscheme, className }))}>
        revelations
      </Text>
      <Text
        className={cn(
          logoVariants({ className, colorscheme, size }),
          "text-blue-400"
        )}
      >
        AI
      </Text>
    </View>
  );
}
