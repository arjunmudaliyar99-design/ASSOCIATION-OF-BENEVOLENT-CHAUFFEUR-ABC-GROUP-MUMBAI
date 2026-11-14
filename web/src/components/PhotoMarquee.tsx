import Photo from "@/components/Photo";
import type { Photo as P } from "@/data/gallery";

/** Two rows of photos drifting in opposite directions. Pauses on hover. */
export default function PhotoMarquee({ rows }: { rows: [P[], P[]] }) {
  return (
    <div className="grid gap-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} className="group overflow-hidden">
          <div className={`flex w-max gap-5 ${r ? "animate-marqueeR" : "animate-marquee"} group-hover:[animation-play-state:paused]`}>
            {[...row, ...row].map((p, k) => (
              <div key={`${p.src}-${k}`} aria-hidden={k >= row.length}
                className="relative h-52 shrink-0 overflow-hidden rounded-2xl shadow-[0_14px_30px_-14px_rgb(var(--ink)/.45)] md:h-64"
                style={{ aspectRatio: `${p.w} / ${p.h}` }}>
                <Photo src={p.src} alt={k < row.length ? "ABC members at a service drive" : ""} fill sizes="420px" className="object-cover transition duration-700 hover:scale-110" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
