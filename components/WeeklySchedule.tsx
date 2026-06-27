"use client";

import { useState, useEffect } from "react";
import { X, Plus, Calendar, Check } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Place } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/data/categories";
import { cn, sortPlaces } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];

type SlotKey = `${string}-${string}`;
type Schedule = Record<SlotKey, Place[]>;

const STORAGE_KEY = "cityroots-schedule";

interface WeeklyScheduleProps {
  availablePlaces?: Place[];
}

function loadSchedule(): Schedule {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSchedule(schedule: Schedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

export function WeeklySchedule({ availablePlaces = [] }: WeeklyScheduleProps) {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [addingTo, setAddingTo] = useState<SlotKey | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSchedule(loadSchedule());
  }, []);

  function addPlace(slotKey: SlotKey, place: Place) {
    setSchedule((prev) => {
      const existing = prev[slotKey] ?? [];
      if (existing.some((p) => p.id === place.id)) return prev;
      const next = { ...prev, [slotKey]: [...existing, place] };
      saveSchedule(next);
      return next;
    });
    setAddingTo(null);
    setQuery("");
  }

  function removePlace(slotKey: SlotKey, placeId: string) {
    setSchedule((prev) => {
      const next = {
        ...prev,
        [slotKey]: (prev[slotKey] ?? []).filter((p) => p.id !== placeId),
      };
      saveSchedule(next);
      return next;
    });
  }

  function exportSchedule() {
    const lines: string[] = ["My weekly routine\n"];
    DAYS.forEach((day) => {
      const dayLines: string[] = [];
      TIMES.forEach((time) => {
        const key: SlotKey = `${day}-${time}`;
        const places = schedule[key] ?? [];
        if (places.length > 0) {
          dayLines.push(`  ${time}: ${places.map((p) => p.name).join(", ")}`);
        }
      });
      if (dayLines.length > 0) {
        lines.push(`${day}:\n${dayLines.join("\n")}`);
      }
    });
    const text = lines.join("\n\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const sortedPlaces = sortPlaces(availablePlaces);
  const filteredSuggestions = query.trim()
    ? sortedPlaces.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          CATEGORIES[p.category].shortLabel.toLowerCase().includes(q) ||
          CATEGORIES[p.category].label.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : sortedPlaces.slice(0, 8);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-[13px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Plan your week
      </button>
    );
  }

  const totalScheduled = Object.values(schedule).reduce((acc, places) => acc + places.length, 0);

  return (
    <div className="border border-[#E5DED4] dark:border-[#2E2A24] rounded-2xl bg-white dark:bg-[#1B1916] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-stone-400 dark:text-stone-500" />
          <h3 className="font-medium text-stone-800 dark:text-stone-200 text-[13px]">Weekly planner</h3>
          {totalScheduled > 0 && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500">{totalScheduled} planned</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalScheduled > 0 && (
            <button
              onClick={exportSchedule}
              className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-brand dark:text-green-500" />
                  <span className="text-brand dark:text-green-500">Copied</span>
                </>
              ) : (
                "Copy to clipboard"
              )}
            </button>
          )}
          <button
            onClick={() => setExpanded(false)}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            aria-label="Close planner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {totalScheduled === 0 && (
        <div className="px-5 py-6 text-center border-b border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
          <p className="text-[13px] text-stone-400 dark:text-stone-500">Your planner is empty.</p>
          <p className="text-[12px] text-stone-300 dark:text-stone-600 mt-1">Click <strong className="font-medium">Add</strong> in any cell to start building your routine.</p>
        </div>
      )}

      {/* Desktop grid */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-stone-400 dark:text-stone-600 font-medium w-24" />
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-center text-stone-500 dark:text-stone-400 font-semibold border-l border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((time) => (
              <tr key={time} className="border-t border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
                <td className="p-2 text-stone-400 dark:text-stone-600 font-medium text-[11px]">{time}</td>
                {DAYS.map((day) => {
                  const key: SlotKey = `${day}-${time}`;
                  const places = schedule[key] ?? [];
                  return (
                    <td
                      key={key}
                      className="p-1.5 align-top border-l border-[#E5DED4]/60 dark:border-[#2E2A24]/60 min-w-[110px]"
                    >
                      <div className="flex flex-col gap-1 min-h-[40px]">
                        {places.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 rounded-lg px-2 py-1 border border-[#E5DED4]/80 dark:border-stone-700 group"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: CATEGORY_COLORS[p.category] }}
                            />
                            <span className="flex-1 text-stone-600 dark:text-stone-300 truncate text-[10px]">{p.name}</span>
                            <button
                              onClick={() => removePlace(key, p.id)}
                              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                              aria-label={`Remove ${p.name}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => { setAddingTo(key); setQuery(""); }}
                          className="flex items-center gap-1 text-stone-300 dark:text-stone-600 hover:text-brand dark:hover:text-green-500 transition-colors text-[10px]"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile accordion */}
      <div className="md:hidden divide-y divide-[#E5DED4]/60 dark:divide-[#2E2A24]/60">
        {DAYS.map((day) => (
          <details key={day} className="group">
            <summary className="flex items-center justify-between px-5 py-3 cursor-pointer list-none select-none">
              <span className="font-medium text-[13px] text-stone-700 dark:text-stone-200">{day}</span>
              {(() => {
                const count = TIMES.reduce((acc, t) => acc + (schedule[`${day}-${t}` as SlotKey]?.length ?? 0), 0);
                return count > 0 ? (
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">{count}</span>
                ) : (
                  <span className="text-[11px] text-stone-300 dark:text-stone-700">empty</span>
                );
              })()}
            </summary>
            <div className="px-5 pb-4 space-y-3">
              {TIMES.map((time) => {
                const key: SlotKey = `${day}-${time}`;
                const places = schedule[key] ?? [];
                return (
                  <div key={time}>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium mb-1.5">{time}</p>
                    <div className="space-y-1">
                      {places.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-lg px-3 py-1.5 border border-[#E5DED4]/80 dark:border-stone-700"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: CATEGORY_COLORS[p.category] }}
                          />
                          <span className="flex-1 text-[12px] text-stone-600 dark:text-stone-300">{p.name}</span>
                          <button
                            onClick={() => removePlace(key, p.id)}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${p.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => { setAddingTo(key); setQuery(""); }}
                        className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 hover:text-brand dark:hover:text-green-500 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      {/* Add place search */}
      {addingTo && (
        <div className="border-t border-[#E5DED4] dark:border-[#2E2A24] p-4 bg-stone-50/60 dark:bg-stone-900/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-medium text-stone-500 dark:text-stone-400">
              Add to {addingTo.replace("-", ", ")}
            </p>
            <button onClick={() => setAddingTo(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places..."
            autoFocus
            className="w-full px-3 h-9 rounded-xl border border-[#E5DED4] dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all"
          />
          <div className="mt-2 space-y-0.5">
            {filteredSuggestions.length === 0 ? (
              <p className="text-[12px] text-stone-400 dark:text-stone-500 py-2 text-center">No matches</p>
            ) : (
              filteredSuggestions.map((p) => {
                const cat = CATEGORIES[p.category];
                const alreadyAdded = (schedule[addingTo] ?? []).some((s) => s.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addPlace(addingTo, p)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all",
                      alreadyAdded
                        ? "border-transparent text-stone-300 dark:text-stone-700 cursor-default"
                        : "border-transparent hover:bg-white dark:hover:bg-stone-800 hover:border-[#E5DED4] dark:hover:border-stone-700"
                    )}
                  >
                    <CategoryIcon category={p.category} className="w-4 h-4" style={{ color: CATEGORY_COLORS[p.category] }} />
                    <span className={cn("text-[13px] flex-1 truncate", alreadyAdded ? "text-stone-300 dark:text-stone-700" : "text-stone-700 dark:text-stone-200")}>{p.name}</span>
                    {alreadyAdded
                      ? <Check className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700 shrink-0" aria-label="Already added" />
                      : <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">{cat.shortLabel}</span>
                    }
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
