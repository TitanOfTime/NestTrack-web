export default function HelpPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="rounded-xl border border-white/10 bg-[#111111] px-12 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
          <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Help &amp; Support</h1>
        <p className="mt-3 text-sm text-gray-500">This section is under development. Check back soon.</p>
      </div>
    </div>
  );
}
