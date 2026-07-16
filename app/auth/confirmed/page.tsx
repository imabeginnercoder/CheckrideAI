import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-700">OK</div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Email confirmed</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your account is ready. Your aircraft preference and study plan will be waiting on the dashboard.</p>
        <Link href="/dashboard" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Open dashboard</Link>
      </section>
    </main>
  );
}
