"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search places, events, tags...",
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // Press "/" to focus search (when not already in an input/textarea)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-white border rounded-xl px-3 h-10 transition-all",
        focused ? "border-brand ring-2 ring-brand/20" : "border-zinc-300",
        className
      )}
    >
      <Search className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
        aria-label="Search places"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
