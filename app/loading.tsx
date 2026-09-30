export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs transition-opacity duration-150">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
        <span className="font-mono text-xs text-slate-500 font-medium tracking-wider uppercase">
          Loading ZeroPlate...
        </span>
      </div>
    </div>
  );
}
