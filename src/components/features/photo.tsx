import Image from "next/image";
import type { PhotoInfo } from "@/lib/photos";
import { cn } from "@/lib/cn";

type PhotoProps = {
  photo: PhotoInfo;
  alt: string;
  sizes: string;
  /** For the LCP hero only: preloads the image from the document head. */
  preload?: boolean;
  /** Lower quality for full-bleed heroes, where the photo sits under a scrim. */
  quality?: 60 | 75;
  className?: string;
};

/** Full-cover photograph with its generated blur placeholder. */
export function Photo({ photo, alt, sizes, preload, quality = 75, className }: PhotoProps) {
  return (
    <Image
      src={photo.src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      quality={quality}
      placeholder="blur"
      blurDataURL={photo.blurDataURL}
      className={cn("object-cover", className)}
    />
  );
}

/** Attribution required by the photo's license. */
export function PhotoCredit({ photo, className }: { photo: PhotoInfo; className?: string }) {
  const { artist, license, licenseUrl, source } = photo.credit;
  return (
    <p className={cn("text-[11px] leading-tight", className)}>
      <a href={source} className="hover:underline" rel="noopener" target="_blank">
        Photo: {artist}
      </a>
      {", "}
      {licenseUrl ? (
        <a href={licenseUrl} className="hover:underline" rel="license noopener" target="_blank">
          {license}
        </a>
      ) : (
        license
      )}
    </p>
  );
}
