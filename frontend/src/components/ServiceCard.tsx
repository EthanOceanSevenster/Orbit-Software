import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { IconBadge } from "@/components/IconTile";
import type { Service } from "@/lib/content";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services#${service.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div className="flex items-start justify-between gap-3">
        <IconBadge icon={service.icon} />
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            service.included
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {service.included ? "Included" : "Quoted separately"}
        </span>
      </div>
      <h3 className="mt-6 text-lg font-semibold">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
