import Link from "next/link";

const features = [
  {
    label: "Focused practice sets",
    detail: "Pick the categories that need work and build a study session around them.",
    icon: "M4 8L7 11L12 5",
  },
  {
    label: "Practice exams",
    detail: "Run a broader review, then see what you missed by category.",
    icon: "M4 4H12M4 8H10M4 12H8",
  },
  {
    label: "AI oral examiner",
    detail: "Rehearse oral exam questions with a realistic chatbot DPE and get instant session summaries.",
    icon: "M3 5H13M5 9H11M7 13H9",
  },
  {
    label: "Progress dashboard",
    detail: "Watch score trends, category mastery, and suggested review areas update as you practice.",
    icon: "M3 12L6 8L9 10L13 4",
  },
];

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 5.5V12.5M5.8 9H12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-950">CheckrideAI</p>
        <p className="text-xs font-medium text-slate-500">Private pilot prep</p>
      </div>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
      <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Study picture</p>
            <p className="mt-1 text-sm font-semibold">Today&apos;s flight plan</p>
          </div>
          <span className="rounded-md bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">VFR</span>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Category mastery</p>
              <span className="text-xs text-slate-400">ACS review</span>
            </div>
            {[
              ["Weather", "74%"],
              ["Navigation", "82%"],
              ["Regulations", "68%"],
            ].map(([label, value]) => (
              <div key={label} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-white" style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">AI DPE</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Tell me how you would evaluate ceilings and visibility before a short cross-country.
              </p>
            </div>
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-xs font-semibold text-amber-200">Suggested next</p>
              <p className="mt-1 text-sm text-white">Review weather minimums, then run a 15-question set.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(25deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:70px_70px]" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-950/10" />
        <div className="relative mx-auto max-w-6xl px-6 py-6">
          <nav className="flex items-center justify-between">
            <LogoMark />
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create account
              </Link>
            </div>
          </nav>

          <div className="grid min-h-[calc(100vh-88px)] items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="mb-6 flex flex-wrap gap-2">
                {["PPL", "ACS", "DPE", "Written"].map((chip) => (
                  <span key={chip} className="rounded-md border border-slate-300 bg-white/60 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 md:text-6xl">
                Private Pilot Prep Designed for You.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                CheckrideAI helps student pilots practice FAA-style questions, rehearse oral exam scenarios, and track category mastery so every study session has a clear next step.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-950"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Built for students preparing for the oral and written portions of the private pilot checkride.
              </p>
            </div>

            <HeroPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d={feature.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-950">{feature.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{feature.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f8f6]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Study flow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">A calmer way to know what to study next.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Preflight", "Choose the categories that need attention."],
              ["Departure", "Complete a focused set or full practice exam."],
              ["Cruise", "Review score movement and mastery by category."],
              ["Approach", "Rehearse oral questions with the AI DPE."],
            ].map(([step, detail]) => (
              <div key={step} className="border-l border-slate-300 pl-4">
                <p className="text-sm font-bold text-slate-950">{step}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
