export default function PageHero({ title, intro }: { title: string; intro?: string }) {
  return (
    <section className="relative bg-sun text-on-sun">
      <div className="wrap grid gap-4 pb-16 pt-14">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none">{title}</h1>
        {intro && <p className="max-w-2xl text-xl opacity-90">{intro}</p>}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3 bg-navy"><div className="lane mt-1 h-1 animate-drive" /></div>
    </section>
  );
}
