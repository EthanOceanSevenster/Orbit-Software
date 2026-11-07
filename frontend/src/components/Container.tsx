import type { ReactNode } from "react";

/**
 * Shared page gutter. Used directly by <Container> and by any element that
 * needs to line up with it (the header bars, the services mega-menu).
 */
export const containerClass = "mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12 xl:px-16";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${containerClass} ${className}`}>{children}</div>;
}
