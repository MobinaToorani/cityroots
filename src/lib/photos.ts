import manifest from "@/content/photos.json";

export type PhotoCredit = {
  artist: string;
  license: string;
  licenseUrl: string | null;
  source: string;
};

export type PhotoInfo = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  credit: PhotoCredit;
};

const photos = manifest as Record<string, Omit<PhotoInfo, "src">>;

/** Looks up a prepared photo. Returns null for paths that have not been processed. */
export function photo(src: string | null | undefined): PhotoInfo | null {
  if (!src) return null;
  const info = photos[src];
  return info ? { src, ...info } : null;
}
