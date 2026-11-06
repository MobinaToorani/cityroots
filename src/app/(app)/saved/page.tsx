import type { Metadata } from "next";
import { SavedList } from "@/components/features/saved-list";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      <h1 className="mb-5 text-section font-semibold tracking-tight">Saved</h1>
      <SavedList />
    </div>
  );
}
