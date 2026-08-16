import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-ink transition-[box-shadow,border-color,transform] duration-[var(--dur)] ease-[var(--ease-out)]",
  {
    variants: {
      variant: {
        base: "rounded-lg border border-hairline bg-canvas p-8 shadow-sm hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md",
        feature:
          "rounded-xl bg-[var(--feature-bg)] p-8 text-d-text shadow-none",
        numbered:
          "rounded-lg border border-hairline bg-canvas p-8 shadow-sm",
      },
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  index?: string | number
  title?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, index, title, children, ...props }, ref) => {
    const numbered =
      variant === "numbered"
        ? String(index ?? "").padStart(2, "0")
        : null

    return (
      <div
        ref={ref}
        className={cn(
          variant
            ? cardVariants({ variant })
            : "rounded-xl border bg-card text-card-foreground shadow",
          className
        )}
        {...props}
        {...(variant === "feature" ? { "data-cursor-dark": true } : {})}
      >
        {variant === "numbered" && numbered && (
          <span className="mb-6 block font-mono text-[length:var(--fs-eyebrow)] uppercase tracking-[0.18em] text-muted-2">
            {numbered}
          </span>
        )}
        {title && (
          <h3
            className={cn(
              "font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em]",
              variant === "feature" ? "text-d-text" : "text-ink"
            )}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
