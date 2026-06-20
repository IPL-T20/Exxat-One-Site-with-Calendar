"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox@1.1.4";
import { FontAwesomeIcon } from "../font-awesome-icon";

import { cn } from "./utils";

function Checkbox(
  {
    className,
    ...props
  }: React.ComponentProps<typeof CheckboxPrimitive.Root>
) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-[#3F51B5] data-[state=checked]:text-white data-[state=indeterminate]:bg-[#3F51B5] data-[state=indeterminate]:text-white dark:data-[state=checked]:bg-[#3F51B5] data-[state=checked]:border-[#3F51B5] data-[state=indeterminate]:border-[#3F51B5] focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {props.checked === "indeterminate" ? (
          <FontAwesomeIcon name="minus" className="size-3.5" />
        ) : (
          <FontAwesomeIcon name="check" className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };