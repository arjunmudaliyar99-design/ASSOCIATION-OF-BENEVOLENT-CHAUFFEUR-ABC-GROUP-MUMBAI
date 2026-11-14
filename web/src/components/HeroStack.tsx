"use client";
import Photo from "@/components/Photo";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const cards = [
  { src: "/photos/drivers-felicitation-bus-event/03.jpg", cap: "Drivers' felicitation", r: -6, x: "-4%", y: "4%" },
  { src: "/photos/ashram-food-seva/03.jpg", cap: "Meals at the ashram", r: 5, x: "18%", y: "-6%" },
  { src: "/photos/childrens-home-visit/03.jpg", cap: "Children's home visit", r: -2, x: "8%", y: "30%" },
];

/** Three photo "postcards" that deal onto the table on load and tilt with the pointer. */
export default function HeroStack() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [6, -6]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 120, damping: 18 });
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-xl [perspective:1200px]"
      onPointerMove={(e) => { if (reduce) return; const b = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - b.left) / b.width) * 2 - 1); my.set(((e.clientY - b.top) / b.height) * 2 - 1); }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}>
      <motion.div style={{ rotateX: rx, rotateY: ry }} className="absolute inset-0 [transform-style:preserve-3d]">
        {cards.map((c, i) => (
          <motion.figure key={c.src}
            initial={reduce ? false : { y: 160, rotate: 0, opacity: 0 }}
            animate={{ y: 0, rotate: c.r, opacity: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.15 + i * 0.14 }}
            whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
            className="absolute w-[68%] rounded-2xl bg-card p-2.5 pb-3 shadow-[0_18px_40px_rgb(31_29_107/.28)]"
            style={{ left: c.x, top: c.y, zIndex: i }}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Photo src={c.src} alt={c.cap} fill priority={i === 0} sizes="(min-width:1024px) 400px, 70vw" className="object-cover" />
            </div>
            <figcaption className="px-1 pt-2 font-display text-base font-bold text-ink">{c.cap}</figcaption>
          </motion.figure>
        ))}
        <motion.div initial={reduce ? false : { scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: -12 }} transition={{ type: "spring", delay: 0.75 }}
          className="absolute -right-2 bottom-[6%] z-20 grid h-28 w-28 place-items-center rounded-full bg-sindoor text-center font-display text-lg font-extrabold leading-tight text-white shadow-lg">
          Since<br />2023
        </motion.div>
      </motion.div>
    </div>
  );
}
