
"use client"
import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200 border", className)}
    {...props}
  >
    <div
      className={cn("h-full transition-all bg-primary", indicatorClassName)} // Added bg-primary here as it was missing from the outline but present in original and typically expected for a progress bar indicator.
      style={{ width: `${value || 0}%` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
