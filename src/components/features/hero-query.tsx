"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { homeCity } from "@/lib/client/stores";

const tones = {
  // White on a darkened photo.
  photo: {
    text: "text-white",
    select:
      "border-white/70 text-white hover:border-white focus-visible:border-white focus-visible:outline-white",
    button: "photo" as const,
  },
  // On the page's own paper: each choice is underlined in the accent, a blank to fill in.
  paper: {
    text: "text-text",
    select: "border-accent text-primary-text hover:border-primary-text focus-visible:outline-focus",
    button: "primary" as const,
  },
};

type Tone = keyof typeof tones;

/** A native select drawn as an underlined word, with a caret in the same colour. */
function Choice({
  label,
  tone,
  children,
  ...select
}: {
  label: string;
  tone: Tone;
  children: ReactNode;
} & ComponentProps<"select">) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        {...select}
        className={cn(
          "[field-sizing:content] min-h-11 cursor-pointer appearance-none rounded-none border-0 border-b-2 bg-transparent pr-[1.1em] pl-0.5 font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 [&>option]:bg-surface-solid [&>option]:text-text",
          tones[tone].select,
        )}
      >
        {children}
      </select>
      <Icon
        icon={ChevronDown}
        size={20}
        className={cn(
          "pointer-events-none absolute right-0",
          tone === "paper" ? "text-primary-text" : "text-white",
        )}
      />
    </label>
  );
}

/**
 * The whole product as one sentence. A plain GET form to /go, so it works
 * without JavaScript; the browser's own menus make it easy on a phone.
 */
export function HeroQuery({
  cities,
  tone = "photo",
  className,
}: {
  cities: { slug: string; name: string }[];
  tone?: Tone;
  className?: string;
}) {
  const city = homeCity.use() ?? "";

  return (
    <form action="/go" method="get" className={cn("mt-6", className)}>
      <p className={cn("text-[clamp(1.25rem,1rem+1.2vw,1.75rem)] leading-[1.9]", tones[tone].text)}>
        Show me{" "}
        <Choice label="Budget" tone={tone} name="budget" defaultValue="free">
          <option value="free">free</option>
          <option value="any">any</option>
        </Choice>{" "}
        things to do in{" "}
        <Choice
          label="City"
          tone={tone}
          name="city"
          value={city}
          onChange={(e) => homeCity.write(e.target.value || null)}
        >
          <option value="">all cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Choice>{" "}
        <Choice label="When" tone={tone} name="when" defaultValue="weekend">
          <option value="weekend">this weekend</option>
          <option value="today">today</option>
          <option value="now">right now</option>
          <option value="anytime">anytime</option>
        </Choice>
      </p>
      <Button type="submit" variant={tones[tone].button} size="lg" className="mt-5">
        Find things to do
        <Icon icon={ArrowRight} size={16} />
      </Button>
    </form>
  );
}
