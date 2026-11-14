import Photo from "@/components/Photo";
import Aurora from "@/components/Aurora";

export default function PageHero({ title, intro, photo }: { title: string; intro?: string; photo?: string }) {
  return (
    <section className="relative overflow-hidden bg-sun">
      <Aurora />
      <div className={`wrap relative grid items-center gap-10 py-16 md:py-20 ${photo ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        <div className="grid gap-5">
          <h1 className="animate-rise font-display text-[clamp(2.75rem,6.5vw,5.5rem)] font-extrabold leading-[.95] tracking-tight">{title}</h1>
          {intro && <p style={{ animationDelay: "120ms" }} className="animate-rise max-w-2xl text-xl leading-relaxed text-ink/80">{intro}</p>}
        </div>
        {photo && (
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-20px_rgb(var(--ink)/.45)] lg:block animate-rise [animation-delay:200ms]">
            <Photo src={photo} alt="" fill priority sizes="40vw" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
