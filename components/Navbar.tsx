"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Leaf, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const KNOWN_ROUTES = new Set(["/", "/explore", "/about", "/submit"]);

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isCityPage = !KNOWN_ROUTES.has(pathname) && !pathname.startsWith("/_");

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/about", label: "About" },
    { href: "/submit", label: "Submit" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F7F4EF]/96 dark:bg-[#0F0E0C]/96 backdrop-blur border-b border-[#E5DED4]/60 dark:border-[#2E2A24]/60">
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between">

        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <Leaf className="w-4 h-4 text-brand flex-shrink-0 transition-opacity group-hover:opacity-70" />
          <span className="font-serif text-[17px] font-medium tracking-[-0.01em] text-stone-800 dark:text-stone-100 transition-opacity group-hover:opacity-70">
            CityRoots
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(link.href + "/") ||
              (link.href === "/explore" && isCityPage);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[13px] tracking-wide transition-all",
                  isActive
                    ? "text-stone-900 dark:text-stone-100 font-medium"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-normal"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" aria-hidden />
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-72 px-6 pt-5 pb-8 bg-[#F7F4EF] dark:bg-[#0F0E0C] border-l border-[#E5DED4] dark:border-[#2E2A24]">
              <SheetTitle className="flex items-center gap-2.5 mb-8 pr-10 font-serif text-[17px] font-medium text-stone-800 dark:text-stone-100">
                <Leaf className="w-4 h-4 text-brand" />
                CityRoots
              </SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/") ||
                    (link.href === "/explore" && isCityPage);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "text-[15px] px-3 py-2.5 rounded-xl transition-colors",
                        isActive
                          ? "text-stone-900 dark:text-stone-100 font-medium bg-stone-100 dark:bg-stone-800"
                          : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
