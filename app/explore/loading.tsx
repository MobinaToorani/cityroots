export default function ExploreLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <div className="h-7 w-40 bg-zinc-100 rounded mb-2" />
        <div className="h-4 w-56 bg-zinc-100 rounded" />
      </div>
      <div className="h-10 w-80 bg-zinc-100 rounded-xl mb-10" />
      <div className="mb-4">
        <div className="h-3 w-28 bg-zinc-100 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-3">
              <div className="h-5 w-32 bg-zinc-100 rounded" />
              <div className="h-3.5 w-24 bg-zinc-100 rounded" />
              <div className="h-3 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-4/5 bg-zinc-100 rounded" />
              <div className="flex gap-3 pt-2 border-t border-zinc-100">
                <div className="h-3 w-16 bg-zinc-100 rounded" />
                <div className="h-3 w-12 bg-zinc-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
