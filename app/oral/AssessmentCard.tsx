import type { OralAssessment } from "@/lib/oral-exam";

const readinessLabels: Record<OralAssessment["readiness"], string> = {
  "building-foundation": "Building foundation",
  developing: "Developing",
  "nearly-ready": "Nearly ready",
  "checkride-ready": "Checkride ready",
};

export default function AssessmentCard({ assessment }: { assessment: OralAssessment }) {
  return (
    <section className="space-y-5" aria-labelledby="oral-scorecard-title">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Practice readiness</p>
          <p className="mt-4 text-5xl font-bold">{assessment.overallScore}</p>
          <p className="mt-1 text-sm text-slate-300">out of 100</p>
          <span className="mt-5 inline-flex rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
            {readinessLabels[assessment.readiness]}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 id="oral-scorecard-title" className="text-lg font-bold text-slate-950">Session summary</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{assessment.summary}</p>
          {assessment.strengths.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Demonstrated strengths</p>
              <ul className="mt-2 space-y-2">
                {assessment.strengths.map((strength) => (
                  <li key={strength} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-bold text-slate-950">ACS areas to review</h2>
          <p className="mt-1 text-xs text-slate-500">Practice feedback aligned to FAA-S-ACS-6C. This is not an official FAA evaluation.</p>
        </div>
        {assessment.areasToReview.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No material gaps were identified in this session. Continue rotating through other ACS areas.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessment.areasToReview.map((area) => (
              <article key={`${area.acsCode}-${area.finding}`} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{area.acsArea}</h3>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{area.acsCode}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{area.finding}</p>
                  </div>
                  <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{area.score}%</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-700">Study next</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{area.studyRecommendation}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-700">Reference</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{area.reference}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
