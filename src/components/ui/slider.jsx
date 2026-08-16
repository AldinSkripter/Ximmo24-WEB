import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { isRTL } from "@/utils/helperFunction"

const Slider = React.forwardRef(({ className, dir, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    dir={dir || (isRTL() ? "rtl" : "ltr")}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}>
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full primaryBg" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border border-primary/50 primaryBg shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer" />
    {props.isTwoThumb && <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border border-primary/50 primaryBg shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer" />}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
