"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  city: z.string().min(2, "Please enter a city name"),
  name: z.string().min(2, "Place name is required"),
  category: z.string().min(1, "Please select a category"),
  type: z.enum(["place", "event", "program", "resource"]),
  cost: z.enum(["free", "low", "moderate", "varies"]),
  description: z.string().min(10, "Please describe this place").max(300, "Keep it under 300 characters"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  why: z.string().max(300, "Keep it under 300 characters").optional(),
  yourName: z.string().optional(),
  yourEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? "#";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-xl border border-[#E5DED4] dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:focus:ring-brand/20 transition-all";

const SELECT_CLS =
  "w-full h-10 px-3 rounded-xl border border-[#E5DED4] dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] text-stone-700 dark:text-stone-300 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:focus:ring-brand/20 transition-all";

const TEXTAREA_CLS =
  "w-full px-3 py-2.5 rounded-xl border border-[#E5DED4] dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:focus:ring-brand/20 resize-none transition-all";

const LABEL_CLS = "block text-[12px] font-medium text-stone-600 dark:text-stone-400 mb-1.5";

export function SubmitForm() {
  const [submitted, setSubmitted] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [whyLength, setWhyLength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "place", cost: "free" },
  });

  async function onSubmit(data: FormValues) {
    if (FORMSPREE_ENDPOINT === "#") {
      setSubmitted(true);
      return;
    }
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-5 sm:px-8 py-24 text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-brand dark:text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-[24px] text-stone-800 dark:text-stone-100">
            Thank you.
          </h2>
          <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed">
            Your submission has been received and will be reviewed before being added to the guide.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mt-2"
        >
          Back to home
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1B1916] border-b border-[#E5DED4] dark:border-[#2E2A24]">
        <div
          className="absolute -top-16 right-0 w-[400px] h-[400px] rounded-full pointer-events-none animate-aura-pulse"
          style={{ background: "radial-gradient(circle, rgba(61,107,82,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[350px] h-[200px] rounded-full pointer-events-none animate-aura-drift opacity-40"
          style={{ background: "radial-gradient(ellipse, rgba(106,173,130,0.1) 0%, transparent 70%)", animationDelay: "2s" }}
        />
        <div className="relative max-w-2xl mx-auto px-5 sm:px-8 pt-10 pb-12 sm:pt-16 sm:pb-14">
          <div className="flex items-center gap-4 mb-8 sm:mb-12">
            <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-stone-400 dark:text-stone-600">
              Community
            </span>
            <div className="h-px bg-stone-200 dark:bg-stone-800 w-16 sm:w-28" />
          </div>
          <h1 className="font-serif text-[44px] sm:text-[60px] lg:text-[76px] leading-[0.88] tracking-[-0.04em] text-stone-900 dark:text-stone-50 mb-5">
            <span className="block">Share a</span>
            <span className="block italic font-normal text-[#3D6B52] dark:text-[#7AB893] pl-6 sm:pl-14">
              place.
            </span>
          </h1>
          <p className="text-[13px] sm:text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed max-w-sm">
            Know a park, cafe, event, program, or resource that belongs in a city guide?
            Submissions are reviewed before being added.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 sm:space-y-8">

          {/* Section: Location */}
          <div className="space-y-5">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-[0.1em] uppercase">
              Location
            </p>
            <div className="space-y-1.5">
              <label htmlFor="city" className={LABEL_CLS}>City *</label>
              <input
                id="city"
                placeholder="e.g. Richmond Hill, Oakville, Markham..."
                {...register("city")}
                className={INPUT_CLS}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
              {errors.city && (
                <p id="city-error" className="text-[11px] text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="address" className={LABEL_CLS}>Address <span className="text-stone-300 dark:text-stone-700 font-normal">(optional)</span></label>
              <input id="address" placeholder="123 Street, City, ON" {...register("address")} className={INPUT_CLS} />
            </div>
          </div>

          {/* Section: Details */}
          <div className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-8">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-[0.1em] uppercase">
              Place details
            </p>

            <div className="space-y-1.5">
              <label htmlFor="name" className={LABEL_CLS}>Name *</label>
              <input
                id="name"
                placeholder="e.g. Mill Pond Park"
                {...register("name")}
                className={INPUT_CLS}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="category" className={LABEL_CLS}>Category *</label>
                <select id="category" {...register("category")} className={SELECT_CLS}>
                  <option value="">Select category</option>
                  {categories.map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.category.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="type" className={LABEL_CLS}>Type *</label>
                <select id="type" {...register("type")} className={SELECT_CLS}>
                  <option value="place">Place</option>
                  <option value="event">Event</option>
                  <option value="program">Program</option>
                  <option value="resource">Resource</option>
                </select>
              </div>
            </div>

            <fieldset>
              <legend className={LABEL_CLS}>Cost *</legend>
              <div className="flex gap-4 flex-wrap pt-1">
                {(["free", "low", "moderate", "varies"] as const).map((c) => {
                  const labels = { free: "Free", low: "Low Cost", moderate: "Moderate", varies: "Varies" };
                  return (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={c} {...register("cost")} className="accent-brand" />
                      <span className="text-[13px] text-stone-600 dark:text-stone-400">{labels[c]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="description" className={LABEL_CLS}>Description *</label>
                <span className={cn("text-[11px] tabular-nums", descriptionLength > 280 ? "text-amber-600" : "text-stone-400 dark:text-stone-600")}>
                  {descriptionLength}/300
                </span>
              </div>
              <textarea
                id="description"
                rows={3}
                placeholder="What is this place? What makes it worth visiting?"
                {...register("description", {
                  onChange: (e) => setDescriptionLength(e.target.value.length),
                })}
                className={TEXTAREA_CLS}
                aria-describedby={errors.description ? "desc-error" : undefined}
              />
              {errors.description && (
                <p id="desc-error" className="text-[11px] text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="why" className={LABEL_CLS}>
                  Why should this be included? <span className="text-stone-300 dark:text-stone-700 font-normal">(optional)</span>
                </label>
                {whyLength > 0 && (
                  <span className={cn("text-[11px] tabular-nums", whyLength > 280 ? "text-amber-600" : "text-stone-400 dark:text-stone-600")}>
                    {whyLength}/300
                  </span>
                )}
              </div>
              <textarea
                id="why"
                rows={2}
                placeholder="What makes this special for the community? Any insider tips?"
                {...register("why", {
                  onChange: (e) => setWhyLength(e.target.value.length),
                })}
                className={TEXTAREA_CLS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className={LABEL_CLS}>Website <span className="text-stone-300 dark:text-stone-700 font-normal">(optional)</span></label>
              <input id="website" type="url" placeholder="https://..." {...register("website")} className={INPUT_CLS} />
              {errors.website && (
                <p className="text-[11px] text-red-500 mt-1">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Section: About you */}
          <div className="space-y-5 border-t border-[#E5DED4] dark:border-[#2E2A24] pt-8">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tracking-[0.1em] uppercase">
              About you <span className="normal-case tracking-normal text-stone-300 dark:text-stone-700 font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="yourName" className={LABEL_CLS}>Your name</label>
                <input id="yourName" placeholder="Jane Smith" {...register("yourName")} className={INPUT_CLS} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="yourEmail" className={LABEL_CLS}>Your email</label>
                <input id="yourEmail" type="email" placeholder="you@example.com" {...register("yourEmail")} className={INPUT_CLS} />
                {errors.yourEmail && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.yourEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex flex-col items-start gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-3 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-[13px] font-medium rounded-full transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit a place"}
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              All submissions are reviewed by our community curators before being added.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
