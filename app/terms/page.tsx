import Link from "next/link";

export const metadata = { title: "Terms | CheckrideAI" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950">CheckrideAI</Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Last updated September 2, 2026</p>
        <h1 className="mt-3 text-4xl font-bold">Terms of use</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">These terms set expectations for using CheckrideAI as an independent study product.</p>

        <div className="mt-10 space-y-9 border-t border-slate-300 pt-9 text-sm leading-7 text-slate-700">
          <section><h2 className="text-lg font-bold text-slate-950">Educational use</h2><p className="mt-2">CheckrideAI provides supplemental private-pilot study material. It does not replace instruction from a certificated flight instructor, current FAA publications, an aircraft POH or AFM, or the judgment of an examiner.</p></section>
          <section><h2 className="text-lg font-bold text-slate-950">No guarantee of accuracy or outcome</h2><p className="mt-2">Questions and AI-generated assessments may contain errors or omit relevant context. Verify operational, regulatory, weather, and aircraft-specific information with authoritative current sources. Use of the service does not guarantee a test result or certificate.</p></section>
          <section><h2 className="text-lg font-bold text-slate-950">Account responsibilities</h2><p className="mt-2">Keep your credentials private, provide accurate account information, and use the service only for lawful personal study. Do not attempt to bypass access controls, rate limits, or other service protections.</p></section>
          <section><h2 className="text-lg font-bold text-slate-950">Availability</h2><p className="mt-2">The service may change, experience interruptions, or be discontinued. Features, question banks, models, and usage limits may be updated as the project evolves.</p></section>
          <section><h2 className="text-lg font-bold text-slate-950">Acceptance</h2><p className="mt-2">By creating an account or using CheckrideAI, you agree to these terms and the privacy policy.</p></section>
        </div>

        <div className="mt-12 border-t border-slate-300 pt-6 text-sm">
          <Link href="/privacy" className="font-semibold text-slate-700 hover:text-slate-950">Privacy policy</Link>
          <span className="mx-3 text-slate-300">|</span>
          <Link href="/" className="font-semibold text-slate-700 hover:text-slate-950">Return home</Link>
        </div>
      </article>
    </main>
  );
}
