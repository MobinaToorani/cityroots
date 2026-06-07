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
import { cn } from "@/lib/utils";

const KNOWN_ROUTES = new Set(["/", "/explore", "/about", "/submit"]);

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // City pages (e.g. /richmond-hill) are part of the Explore section
  const isCityPage = !KNOWN_ROUTES.has(pathname) && !pathname.startsWith("/_");

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/about", label: "About" },
    { href: "/submit", label: "Submit a Place" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-900 hover:text-brand transition-colors"
        >
          <Leaf className="w-5 h-5 text-brand" />
          <span className="text-base tracking-tight">CityRoots</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
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
                  "text-sm transition-colors",
                  isActive
                    ? "text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2 mb-8 mt-2 font-semibold text-zinc-900">
                <Leaf className="w-5 h-5 text-brand" />
                CityRoots
              </SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <div className="flex flex-col gap-4">
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
                        "text-base transition-colors py-1",
                        isActive
                          ? "text-zinc-900 font-medium"
                          : "text-zinc-600 hover:text-zinc-900"
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
