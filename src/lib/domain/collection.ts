import { z } from "zod";
import { cleanCopy } from "./copy";

export const collectionTitleSchema = z
  .string("Give the collection a name")
  .trim()
  .min(1, "Give the collection a name")
  .max(80, "Keep the name under 80 characters")
  .transform(cleanCopy);

export const collectionNoteSchema = z
  .string()
  .trim()
  .max(280, "Keep the note under 280 characters")
  .transform((v) => (v ? cleanCopy(v) : null));
