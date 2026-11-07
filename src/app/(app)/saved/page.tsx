import type { Metadata } from "next";
import { SavedList } from "@/components/features/saved-list";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="page-frame page-top">
      <h1 className="mb-5 page-title">Saved</h1>
      <SavedList />
    </div>
  );
}
