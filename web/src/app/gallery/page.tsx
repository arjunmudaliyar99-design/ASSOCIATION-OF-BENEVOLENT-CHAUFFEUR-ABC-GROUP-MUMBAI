import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = { title: "Gallery", description: "Photos from ABC Group Mumbai's service drives, felicitations and visits." };

export default function GalleryPage() {
  return (
    <>
      <PageHero title="Gallery" intro="Moments from our drives around Mumbai. Pick an album, then swipe or use the arrows." />
      <Gallery />
    </>
  );
}
