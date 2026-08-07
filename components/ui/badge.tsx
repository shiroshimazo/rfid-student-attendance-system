import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Compact status pill.
 *
 * Every variant keeps its text on a foreground token rather than on the tint it
 * sits in, so the label stays legible in both themes; the tint differentiates
 * the category and the label itself carries the meaning.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[0.6875rem] leading-4 font-medium whitespace-nowrap tabular-nums [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-foreground dark:bg-muted/50",
        ink: "bg-series-in/12 text-foreground dark:bg-series-in/16",
        accent: "bg-series-out/20 text-foreground dark:bg-series-out/24",
        destructive: "bg-destructive/12 text-destructive dark:bg-destructive/20",
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
