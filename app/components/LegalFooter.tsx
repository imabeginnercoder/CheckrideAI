import Link from "next/link";

export default function LegalFooter({ dark = false }: { dark?: boolean }) {
  const muted = dark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-950";

  return (
    <footer className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${muted}`}>
      <span>© {new Date().getFullYear()} CheckrideAI</span>
      <Link href="/privacy" className="transition-colors">Privacy</Link>
      <Link href="/terms" className="transition-colors">Terms</Link>
    </footer>
  );
}
