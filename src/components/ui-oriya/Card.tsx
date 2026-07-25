import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function OCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("card-shadow rounded-xl border bg-white", className)}
      style={{ borderColor: "var(--border)", ...(props.style ?? {}) }}
    />
  );
}

export function OCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("flex items-center justify-between px-5 pt-5 pb-3", className)}
    />
  );
}

export function OCardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn("text-[15px] font-semibold", className)}
      style={{ color: "var(--text-primary)", ...(props.style ?? {}) }}
    />
  );
}

export function OCardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-5 pb-5", className)} />;
}