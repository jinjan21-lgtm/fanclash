export default function ComingSoon({ feature, description }: { feature: string; description?: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
      <span className="text-2xl mb-2 block">&#128679;</span>
      <p className="font-medium text-gray-300">{feature}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      <span className="inline-block mt-3 px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full">
        준비 중
      </span>
    </div>
  );
}
