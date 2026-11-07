import {
  Activity,
  ArrowRight,
  CircleCheck,
  DatabaseBackup,
  Gauge,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { LogoMark } from "@/components/Logo";
import { OrbitBackground } from "@/components/OrbitBackground";
import { site } from "@/lib/site";

const HIGHLIGHTS = ["Hosting & SSL included", "One flat monthly fee", "Real people for support"];

export function Hero() {
  return (
    <section className="bg-hero relative overflow-hidden text-white">
      <OrbitBackground />
      <Container className="relative grid items-center gap-16 py-24 sm:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6 xl:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Website design · Managed hosting · Support
          </p>
          <h1 className="mt-7 text-[2.75rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4rem]">
            Your business website, built and run by a{" "}
            <span className="bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              software team
            </span>
            .
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {site.name} designs, builds and hosts professional websites for growing businesses.
            One once-off setup fee, one flat monthly fee, and a team of engineers looking after
            your site.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/get-started" size="lg">
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outlineInverse" size="lg">
              View pricing
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 shrink-0 text-sky-400" strokeWidth={1.75} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <HeroConsole />
        </div>
      </Container>
    </section>
  );
}

const STATUS_TILES = [
  { icon: ShieldCheck, label: "SSL certificate", value: "Active" },
  { icon: DatabaseBackup, label: "Backups", value: "Automated" },
  { icon: Gauge, label: "Performance", value: "Optimised" },
  { icon: Activity, label: "Uptime monitoring", value: "Enabled" },
];

const BARS = [38, 52, 46, 64, 58, 82, 74];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Decorative "cloud console" illustration of a hosted site. */
function HeroConsole() {
  return (
    <div className="relative mx-auto w-full max-w-2xl" aria-hidden="true">
      <div className="rounded-xl border border-white/10 bg-[#0b1a36]/90 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LogoMark className="h-5 w-5" />
            <span className="font-medium text-slate-200">Orbit Console</span>
            <span className="text-slate-600">/</span>
            <span>yourbusiness.co.za</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6">
          {STATUS_TILES.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/45 to-sky-400/15 text-sky-300 ring-1 ring-inset ring-white/15">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Visitors this week</span>
            <span className="text-emerald-300">Trending up</span>
          </div>
          <div className="mt-4 flex h-24 items-end gap-2">
            {BARS.map((height, i) => (
              <div
                key={DAYS[i]}
                className="flex-1 rounded-sm bg-gradient-to-t from-brand to-sky-400"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            {DAYS.map((day) => (
              <span key={day} className="flex-1 text-center">
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 -left-7 hidden items-center gap-3 rounded-xl border border-white/10 bg-navy-2 px-5 py-4 shadow-2xl shadow-black/40 sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
          <Rocket className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="text-xs">
          <p className="font-semibold text-white">Site deployed</p>
          <p className="text-slate-400">Live, hosted and backed up</p>
        </div>
      </div>
    </div>
  );
}
