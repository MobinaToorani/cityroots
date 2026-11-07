"use client";

import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { homeCity } from "@/lib/client/stores";

const selectClass =
  "cursor-pointer appearance-none rounded-none border-0 border-b-2 border-white/70 bg-[length:0.7em] bg-[position:right_center] bg-no-repeat pr-[1em] pl-0.5 font-semibold text-white outline-none transition-colors [field-sizing:content] hover:border-white focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&>option]:text-[#141412]";

const caret = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E\")",
};

/**
 * The whole product as one sentence. A plain GET form to /go, so it works
 * without JavaScript; the browser's own menus make it easy on a phone.
 */
export function HeroQuery({ cities }: { cities: { slug: string; name: string }[] }) {
  const city = homeCity.use() ?? "";

  return (
    <form action="/go" method="get" className="mt-6">
      <p className="text-[clamp(1.25rem,1rem+1.2vw,1.75rem)] leading-[1.9] text-white">
        Show me{" "}
        <label>
          <span className="sr-only">Budget</span>
          <select name="budget" defaultValue="free" className={selectClass} style={caret}>
            <option value="free">free</option>
            <option value="any">any</option>
          </select>
        </label>{" "}
        things to do in{" "}
        <label>
          <span className="sr-only">City</span>
          <select
            name="city"
            value={city}
            onChange={(e) => homeCity.write(e.target.value || null)}
            className={selectClass}
            style={caret}
          >
            <option value="">all cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>{" "}
        <label>
          <span className="sr-only">When</span>
          <select name="when" defaultValue="weekend" className={selectClass} style={caret}>
            <option value="weekend">this weekend</option>
            <option value="today">today</option>
            <option value="now">right now</option>
            <option value="anytime">anytime</option>
          </select>
        </label>
      </p>
      <button
        type="submit"
        className="motion-press mt-5 inline-flex h-12 items-center gap-2 rounded-control bg-white px-6 font-semibold text-[#141412] transition-transform active:translate-y-px"
      >
        Go
        <Icon icon={ArrowRight} size={16} />
      </button>
    </form>
  );
}
