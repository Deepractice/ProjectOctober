import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Neutral - System metadata
        default: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        // Computational - Blue tones
        primary: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200",
        // Generative - Amber tones
        secondary: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200",
        // Success state
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        // Warning state
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        // Info state
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        // Error/Destructive state
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Outline variant
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
