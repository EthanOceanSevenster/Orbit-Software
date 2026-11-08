"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Decides whether a page gets the public site's header and footer.
 *
 * Both signed-in areas, the owner's console and the client portal, carry their
 * own sidebar. Putting the marketing navigation above that gives two
 * navigations arguing on one screen, and offers "Sign in" to somebody who
 * plainly already has. Each sidebar has its own way back to the public site.
 *
 * The header and footer arrive as props rather than imports because they are
 * server components, and this one has to read the path.
 */
const SIGNED_IN_AREAS = ["/dashboard", "/account"];

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
  const bare = SIGNED_IN_AREAS.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );

  // Those areas render their own <main>, so this must not add a second one.
  if (bare) return <>{children}</>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
