import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FormStatus({
  message,
  tone,
  className = "",
}: {
  message: string;
  tone: "error" | "success";
  className?: string;
}) {
  if (!message) return null;

  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  const colors = tone === "error"
    ? "border-rose-300 bg-rose-50 text-rose-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium leading-5 ${colors} ${className}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
