"use client";

/** Partner widgets fail quietly, with a way to the full site. */
export default function EmbedError() {
  return (
    <p className="m-4 rounded-2xl border border-divider bg-surface-solid px-4 py-6 text-center text-body">
      These listings could not load right now.{" "}
      <a href="/" target="_blank" rel="noopener" className="font-semibold quiet-link">
        Open CityRoots
      </a>
    </p>
  );
}
