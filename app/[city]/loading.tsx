export default function CityLoading() {
  return (
    <div>
      <div className="bg-white border-b border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-3 w-40 bg-zinc-100 rounded mb-5" />
          <div className="h-8 w-52 bg-zinc-100 rounded mb-2" />
          <div className="h-3.5 w-28 bg-zinc-100 rounded mb-4" />
          <div className="h-3.5 w-96 bg-zinc-100 rounded mb-1.5" />
          <div className="h-3.5 w-72 bg-zinc-100 rounded mb-5" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-20 bg-zinc-100 rounded-full" />
            <div className="h-6 w-14 bg-zinc-100 rounded-full" />
            <div className="h-6 w-24 bg-zinc-100 rounded-full" />
          </div>
        </div>
      </div>
      <div className="border-b border-zinc-200 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="h-9 bg-zinc-100 rounded-xl w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-zinc-100 rounded-full shrink-0" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-20 bg-zinc-100 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="h-[3px] bg-zinc-100 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-zinc-100 rounded" />
                <div className="h-5 w-44 bg-zinc-100 rounded" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
                <div className="h-3 w-full bg-zinc-100 rounded" />
                <div className="h-3 w-3/4 bg-zinc-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
