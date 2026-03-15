export default function StatsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5">
            <div className="h-4 w-20 bg-gray-800 rounded mb-2" />
            <div className="h-7 w-24 bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
        <div className="h-5 w-32 bg-gray-800 rounded mb-4" />
        <div className="h-64 bg-gray-800 rounded" />
      </div>
    </div>
  );
}
