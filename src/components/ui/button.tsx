import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 industrial-shadow",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary hover:brightness-110 transition-all font-medium tracking-wide",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 transition-all safety-stripe font-medium",
        outline:
          "border-2 border-construction-steel bg-background text-construction-steel hover:bg-construction-steel hover:text-white transition-all font-medium",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-110 transition-all font-medium",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-all",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary transition-all",
        construction: "steel-gradient text-white hover:brightness-110 transition-all font-medium tracking-wide",
        safety: "bg-construction-safety text-foreground hover:brightness-110 transition-all font-bold border-2 border-destructive",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
