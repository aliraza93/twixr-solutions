import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "rounded-md bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "group rounded-md bg-lime px-[22px] py-[14px] font-semibold text-ink hover:-translate-y-px hover:shadow-lime",
        ghost:
          "rounded-md border border-hairline-strong bg-transparent px-[22px] py-[14px] font-semibold text-ink hover:border-ink hover:bg-surface",
        text:
          "group relative rounded-none bg-transparent px-0 py-1 font-semibold text-pine after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-[var(--dur-fast)] after:ease-[var(--ease-out)] hover:after:w-full",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9 rounded-md",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        size: "default",
        class: "h-auto px-[22px] py-[14px]",
      },
      {
        variant: "ghost",
        size: "default",
        class: "h-auto px-[22px] py-[14px]",
      },
      {
        variant: "text",
        size: "default",
        class: "h-auto px-0 py-1",
      },
      {
        variant: "ghost",
        size: "icon",
        class: "h-10 w-10 rounded-full border-hairline p-0",
      },
    ],
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
  arrow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, arrow, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    const showArrow =
      !asChild && (arrow ?? (variant === "primary" || variant === "text"))

    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
        {showArrow && (
          <span
            aria-hidden
            className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-[3px]"
          >
            →
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
