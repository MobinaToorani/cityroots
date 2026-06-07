"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-brand" />
          <h1 className="text-lg font-semibold text-zinc-900">Submitted</h1>
        </div>
        <p className="text-zinc-500 text-sm mb-6">
          Your submission has been received and will be reviewed before being added.
        </p>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Back to home</Link>
      </div>
    );
  }

  const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Submit a place</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Know a park, café, event, program, or resource that belongs in a city guide?
          Submissions are reviewed before being added.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="e.g. Richmond Hill, Oakville, Markham..."
            {...register("city")}
            aria-describedby={errors.city ? "city-error" : undefined}
          />
          {errors.city && (
            <p id="city-error" className="text-xs text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Place / Event / Resource name *</Label>
          <Input
            id="name"
            placeholder="e.g. Mill Pond Park"
            {...register("name")}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register("category")}
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Select category</option>
              {categories.map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              {...register("type")}
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="place">Place</option>
              <option value="event">Event</option>
              <option value="program">Program</option>
              <option value="resource">Resource</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-700 mb-2">Cost *</legend>
          <div className="flex gap-3 flex-wrap">
            {(["free", "low", "moderate", "varies"] as const).map((c) => {
              const labels = { free: "Free", low: "Low Cost", moderate: "Moderate", varies: "Varies" };
              return (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={c} {...register("cost")} className="accent-brand" />
                  <span className="text-sm text-zinc-700">{labels[c]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="description">Brief description *</Label>
            <span className={cn("text-xs tabular-nums", descriptionLength > 280 ? "text-amber-600" : "text-zinc-400")}>
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
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
            aria-describedby={errors.description ? "desc-error" : undefined}
          />
          {errors.description && (
            <p id="desc-error" className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" placeholder="https://..." {...register("website")} />
            {errors.website && (
              <p className="text-xs text-red-600">{errors.website.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Street, City, ON" {...register("address")} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="why">Why should this be included?</Label>
            {whyLength > 0 && (
              <span className={cn("text-xs tabular-nums", whyLength > 280 ? "text-amber-600" : "text-zinc-400")}>
                {whyLength}/300
              </span>
            )}
          </div>
          <textarea
            id="why"
            rows={2}
            placeholder="What makes this place special for the community? Any insider tips?"
            {...register("why", {
              onChange: (e) => setWhyLength(e.target.value.length),
            })}
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
          <div className="space-y-2">
            <Label htmlFor="yourName">
              Your name <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input id="yourName" placeholder="Jane Smith" {...register("yourName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yourEmail">
              Your email <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input id="yourEmail" type="email" placeholder="you@example.com" {...register("yourEmail")} />
            {errors.yourEmail && (
              <p className="text-xs text-red-600">{errors.yourEmail.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand/90 text-white h-11"
        >
          {isSubmitting ? "Submitting..." : "Submit a Place"}
        </Button>

        <p className="text-xs text-zinc-400 text-center">
          All submissions are reviewed by our community curators before being added.
        </p>
      </form>
    </div>
  );
}
