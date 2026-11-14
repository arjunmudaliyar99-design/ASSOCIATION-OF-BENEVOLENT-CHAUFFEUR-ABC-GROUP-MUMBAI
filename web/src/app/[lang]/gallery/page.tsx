import PageHero from "@/components/PageHero";
import Gallery from "@/components/Gallery";
import { pageCtx, pageMeta } from "@/i18n";

export const generateMetadata = ({ params }: { params: Promise<{ lang: string }> }) => pageMeta(params, (t) => ({ title: t.gallery.title, description: t.gallery.intro }), "/gallery");

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { t } = await pageCtx(params);
  return (
    <>
      <PageHero title={t.gallery.title} intro={t.gallery.intro} />
      <Gallery t={{ albums: t.albums, photos: t.gallery.photos, photo: t.gallery.photo, slider: t.slider }} />
    </>
  );
}
