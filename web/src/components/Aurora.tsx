/** Soft drifting light blobs behind the hero. Pure CSS, so it costs almost nothing on phones. */
export default function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-[10%] -top-[20%] h-[60vh] w-[60vh] animate-blob rounded-full bg-[#FFE27A] opacity-80 blur-[90px]" />
      <div className="absolute right-[5%] top-[10%] h-[50vh] w-[50vh] animate-blob rounded-full bg-[#FFB800] opacity-70 blur-[100px] [animation-delay:-6s]" />
      <div className="absolute bottom-[-25%] left-[30%] h-[55vh] w-[55vh] animate-blob rounded-full bg-[#FFF3C4] opacity-90 blur-[100px] [animation-delay:-12s]" />
      <div className="absolute inset-0 opacity-[.06] [background-image:radial-gradient(rgb(31_29_107)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  );
}
