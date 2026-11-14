import Image, { type ImageProps } from "next/image";
import { blur } from "@/data/gallery";

/** next/image with an instant blurred preview, so no empty boxes while a photo loads. */
export default function Photo(props: ImageProps & { src: string }) {
  const b = blur[props.src];
  return <Image {...props} alt={props.alt} placeholder={b ? "blur" : "empty"} blurDataURL={b} />;
}
