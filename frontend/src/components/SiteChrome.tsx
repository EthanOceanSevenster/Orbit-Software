"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Decides whether a page gets the public site's header and footer.
 *
 * The owner's console has its own sidebar and chrome, so the marketing
 * navigation on top of it would be two navigations arguing. Everywhere else,
 * including the client portal, keeps the site's own header: a client signing
 * in is still on the website and may want to walk back into it.
 *
 * The header and footer arrive as props rather than imports because they are
 * server components, and this one has to read the path.
 */
const CONSOLE = "/dashboard";

export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isConsole = pathname === CONSOLE || pathname.startsWith(`${CONSOLE}/`);

  // The console renders its own <main>, so this must not add a second one.
  if (isConsole) return <>{children}</>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
