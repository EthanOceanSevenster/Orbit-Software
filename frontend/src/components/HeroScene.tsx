"use client";

import {
  DatabaseBackup,
  Search,
  ShieldCheck,
  Smartphone,
  Wifi,
  Zap,
} from "lucide-react";

/**
 * The hero's 3D scene: a wireframe planet with satellites in orbit around it.
 *
 * The orbits are real 3D: three rings at different tilts and speeds, each
 * carrying a satellite that genuinely passes behind the planet and comes
 * back round the front. The planet itself is a lit sphere with a surface
 * that scrolls past, which reads as turning far better than a wireframe,
 * which at this size looked like an egg in a cage.
 *
 * Built with CSS transforms rather than a 3D library or somebody else's
 * embed: it is a few hundred bytes, it runs on the compositor, it cannot
 * fail to a "something went wrong" card on a weak phone, and it needs no
 * third party. On the homepage of a company that sells fast hosting, that
 * is not a detail.
 *
 * It stops completely for anyone who asked for less movement.
 */
/*
 * A system, not a diagram: five bodies, each its own size, colour and year.
 * The colours are the brand's own range rather than a rainbow - cyan,
 * sky, violet, a warm amber for contrast, and a pale moon - so it reads as
 * one picture rather than a set of highlighters.
 */
const ORBITS = [
  { size: 600, tiltX: 76, tiltY: 6, spin: 32, body: 17, colour: "#7dd3fc", glow: "rgba(125,211,252,.55)" },
  { size: 500, tiltX: 70, tiltY: -28, spin: 24, body: 12, colour: "#c4b5fd", glow: "rgba(196,181,253,.5)" },
  { size: 406, tiltX: 64, tiltY: 44, spin: 18, body: 21, colour: "#38bdf8", glow: "rgba(56,189,248,.55)" },
  { size: 322, tiltX: 56, tiltY: -52, spin: 13, body: 11, colour: "#fbbf24", glow: "rgba(251,191,36,.5)" },
  { size: 250, tiltX: 50, tiltY: 18, spin: 8, body: 8, colour: "#e2e8f0", glow: "rgba(226,232,240,.45)" },
];

/*
 * What the picture is for.
 *
 * In plain words, because the person reading this runs a butchery and has
 * never needed to know what SSL stands for. "Secure padlock" is the thing
 * they have actually seen in a browser; "SSL certificate" is the thing we
 * are selling, and only one of those means anything to them.
 */
const LABELS = [
  { icon: Wifi, label: "Online day and night", place: "left-0 top-[8%]" },
  { icon: ShieldCheck, label: "Secure padlock", place: "right-0 top-[20%]" },
  { icon: DatabaseBackup, label: "Backed up every day", place: "right-[2%] top-[52%]" },
  { icon: Zap, label: "Opens fast", place: "bottom-[20%] left-0" },
  { icon: Smartphone, label: "Works on phones", place: "bottom-[2%] left-[22%]" },
  { icon: Search, label: "Found on Google", place: "bottom-[6%] right-[4%]" },
];

export function HeroScene() {
  return (
    <div className="scene relative mx-auto aspect-square w-full max-w-[36rem]" aria-hidden="true">
      {/* The light the planet sits in. Painted as a gradient rather than a
          blurred box, which leaves a visible square edge. */}
      <div className="scene-glow absolute inset-0" />

      <div className="scene-stage">
        {ORBITS.map((orbit) => (
          <div
            key={orbit.size}
            className="orbit"
            style={
              {
                width: `${orbit.size}px`,
                height: `${orbit.size}px`,
                "--tilt": `rotateX(${orbit.tiltX}deg) rotateY(${orbit.tiltY}deg)`,
                "--spin": `${orbit.spin}s`,
              } as React.CSSProperties
            }
          >
            <span
              className="satellite"
              style={
                {
                  width: `${orbit.body}px`,
                  height: `${orbit.body}px`,
                  top: `${-orbit.body / 2}px`,
                  left: `calc(50% - ${orbit.body / 2}px)`,
                  "--body": orbit.colour,
                  "--glow": orbit.glow,
                } as React.CSSProperties
              }
            />
          </div>
        ))}

        <div className="globe">
          <span className="globe-fill" />
        </div>
      </div>

      {/* What the orbit is actually doing, said in words. A pretty animation
          that explains nothing is a screensaver. */}
      <ul className="pointer-events-none absolute inset-0">
        {LABELS.map((item) => (
          <li
            key={item.label}
            className={`absolute flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur ${item.place}`}
          >
            <item.icon className="h-3.5 w-3.5 text-sky-300" strokeWidth={1.75} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
