export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="rounded-xl border border-white/10 bg-[#0f0f23] px-12 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
          <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-500">
          This section is under development. Check back soon.
        </p>
      </div>
    </div>
  );
}
