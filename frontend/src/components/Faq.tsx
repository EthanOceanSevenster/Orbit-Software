import { ChevronDown } from "lucide-react";

import { FAQS } from "@/lib/content";

/** Accordion built on <details>, so it works without JavaScript. */
export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {FAQS.map((item, index) => (
        <details key={item.q} className="group" open={index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-medium hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
