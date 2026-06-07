"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/categories";

interface WellbeingWheelProps {
  counts?: Partial<Record<Category, number>>;
  activeCategory?: Category | "all";
  onSelect?: (category: Category | "all") => void;
}

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
const TOTAL = CATEGORY_KEYS.length;
const ANGLE_PER_SEGMENT = 360 / TOTAL;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const gap = 2;
  const s = startAngle + gap / 2;
  const e = endAngle - gap / 2;
  const o1 = polarToCartesian(cx, cy, rOuter, s);
  const o2 = polarToCartesian(cx, cy, rOuter, e);
  const i1 = polarToCartesian(cx, cy, rInner, e);
  const i2 = polarToCartesian(cx, cy, rInner, s);
  const largeArc = e - s > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

export function WellbeingWheel({ counts, activeCategory, onSelect }: WellbeingWheelProps) {
  const [hovered, setHovered] = useState<Category | null>(null);
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 150;
  const rInner = 80;

  const displayCategory = hovered ?? (activeCategory !== "all" ? activeCategory : null);
  const displayData = displayCategory ? CATEGORIES[displayCategory] : null;
  const displayCount = displayCategory ? (counts?.[displayCategory] ?? 0) : null;

  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{ width: "min(280px, 100%)" }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="auto"
        aria-label="Wellbeing category wheel, click a segment to filter"
        role="group"
      >
        {CATEGORY_KEYS.map((key, i) => {
          const startAngle = i * ANGLE_PER_SEGMENT;
          const endAngle = startAngle + ANGLE_PER_SEGMENT;
          const isActive = activeCategory === key;
          const isHovered = hovered === key;
          const midAngle = (startAngle + endAngle) / 2;
          const labelPos = polarToCartesian(cx, cy, rInner + (rOuter - rInner) * 0.5, midAngle);
          const color = CATEGORY_COLORS[key];
          const cat = CATEGORIES[key];

          return (
            <g key={key}>
              <path
                d={describeArc(cx, cy, rOuter, rInner, startAngle, endAngle)}
                fill={color}
                fillOpacity={isActive || isHovered ? 1 : 0.45}
                style={{
                  cursor: "pointer",
                  transition: "fill-opacity 0.15s ease",
                }}
                onClick={() => onSelect?.(isActive ? "all" : key)}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(key)}
                onBlur={() => setHovered(null)}
                aria-label={`${cat.label}${counts?.[key] ? ` (${counts[key]})` : ""}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(isActive ? "all" : key);
                  }
                }}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {cat.emoji}
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={rInner - 8} fill="var(--background)" />
        {displayData ? (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fontSize="22" style={{ userSelect: "none" }}>
              {displayData.emoji}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" style={{ userSelect: "none" }}>
              {displayData.shortLabel}
            </text>
            {displayCount !== null && displayCount > 0 && (
              <text x={cx} y={cy + 28} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" style={{ userSelect: "none", opacity: 0.7 }}>
                {displayCount} places
              </text>
            )}
          </>
        ) : (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="var(--muted-foreground)" style={{ userSelect: "none" }}>
            all categories
          </text>
        )}
      </svg>
    </div>
  );
}
