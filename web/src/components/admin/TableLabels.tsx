"use client";
import { useEffect, useRef } from "react";

/** Copies each column heading onto its cells (data-label) so phone cards can show "Mobile: 98…" etc. */
export default function TableLabels({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const label = () => {
      const heads = [...el.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
      el.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => td.setAttribute("data-label", heads[i] ?? "")));
    };
    label();
    const obs = new MutationObserver(label);
    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
