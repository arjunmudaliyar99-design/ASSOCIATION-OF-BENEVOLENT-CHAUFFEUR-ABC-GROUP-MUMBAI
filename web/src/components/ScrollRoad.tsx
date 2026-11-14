"use client";
import { motion, useScroll, useSpring } from "framer-motion";

/** A road along the top of the page: the yellow lane fills as you scroll. */
export default function ScrollRoad() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5 bg-navy">
      <motion.div style={{ scaleX: x }} className="lane h-full origin-left" />
    </div>
  );
}
