import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Place",
  description:
    "Know a park, café, event, program, or local resource worth sharing? Submit it to be reviewed and added to a CityRoots city guide.",
};

export default function SubmitPage() {
  return <SubmitForm />;
}
