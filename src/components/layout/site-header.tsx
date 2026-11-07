import { PaletteTrigger } from "@/components/features/palette-trigger";
import { listLiveCities } from "@/lib/data/cities";
import { CityPicker } from "./city-picker";
import { Logo } from "./logo";
import { PrimaryNavLinks } from "./nav-link";

/** The one header on every page: where you are, search, and the four things the site does. */
export async function SiteHeader() {
  const cities = await listLiveCities().catch(() => []);
  return (
    <header className="sticky top-0 z-40 border-b border-divider bg-bg/95 backdrop-blur-md">
      <div className="relative page-frame flex h-16 items-center gap-2 sm:gap-3">
        <Logo />
        <CityPicker cities={cities.map((c) => ({ slug: c.slug, name: c.name }))} />
        <div className="ml-auto flex items-center gap-1">
          <div className="mr-2 hidden w-64 xl:block">
            <PaletteTrigger />
          </div>
          <div className="xl:hidden">
            <PaletteTrigger compact />
          </div>
          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            <PrimaryNavLinks variant="header" />
          </nav>
        </div>
      </div>
    </header>
  );
}
