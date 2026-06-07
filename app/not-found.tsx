import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-28 text-center">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">404</p>
      <h1 className="text-2xl font-bold text-zinc-900 mb-3">Page not found</h1>
      <p className="text-zinc-500 text-sm mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="text-sm text-brand hover:underline transition-colors">
          Go home
        </Link>
        <span className="text-zinc-300">·</span>
        <Link href="/explore" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          Browse cities
        </Link>
      </div>
    </div>
  );
}
