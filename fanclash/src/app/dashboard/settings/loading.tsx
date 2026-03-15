export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="h-5 w-32 bg-gray-800 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-800 rounded" />
              <div className="h-10 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
