import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom typography utilities (text-display, text-headline-*, text-label-*,
// text-caption) must be treated as font-size classes so tailwind-merge does
// not confuse them with text color classes like text-primary-foreground.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-headline-lg",
        "text-headline-md",
        "text-headline-sm",
        "text-label-lg",
        "text-label-md",
        "text-caption",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
