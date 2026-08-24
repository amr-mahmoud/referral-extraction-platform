import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier conflicting ones. Every CVA execution is wrapped in this so callers
 * can override styling through `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
