/**
 * Decorative brand background for dark sections: aurora glows, a starfield,
 * a faint grid and tilted orbit rings with satellites travelling along them.
 * Satellites are hidden for visitors who prefer reduced motion (see globals.css).
 */

type Ring = {
  rx: number;
  ry: number;
  opacity: number;
  dash?: string;
  duration: number;
  offset: number;
  size: number;
};

const RINGS: Ring[] = [
  { rx: 250, ry: 92, opacity: 0.26, duration: 26, offset: -4, size: 3.5 },
  { rx: 410, ry: 150, opacity: 0.18, dash: "3 9", duration: 44, offset: -20, size: 4.5 },
  { rx: 590, ry: 218, opacity: 0.13, duration: 68, offset: -48, size: 3.5 },
  { rx: 800, ry: 296, opacity: 0.08, duration: 96, offset: -12, size: 3 },
];

function ellipsePath(rx: number, ry: number): string {
  return `M ${-rx} 0 a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
}

export function OrbitBackground({ focus = "right" }: { focus?: "right" | "center" }) {
  const cx = focus === "right" ? 1060 : 720;
  const cy = focus === "right" ? 370 : 430;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="stars absolute inset-0" />
      <div className="hero-grid absolute inset-0" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="orbit-core-glow">
            <stop offset="0" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="#0b5fff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0b5fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${cx} ${cy}) rotate(-16)`}>
          <circle r="230" fill="url(#orbit-core-glow)" />

          {RINGS.map((ring) => (
            <ellipse
              key={ring.rx}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="#9cc4ff"
              strokeOpacity={ring.opacity}
              strokeWidth="1"
              strokeDasharray={ring.dash}
            />
          ))}

          <g className="orbit-satellites">
            {RINGS.map((ring) => (
              <g key={ring.rx}>
                <circle r={ring.size * 3.2} fill="#38bdf8" fillOpacity="0.16" />
                <circle r={ring.size} fill="#bae6fd" />
                <animateMotion
                  dur={`${ring.duration}s`}
                  begin={`${ring.offset}s`}
                  repeatCount="indefinite"
                  path={ellipsePath(ring.rx, ring.ry)}
                />
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
