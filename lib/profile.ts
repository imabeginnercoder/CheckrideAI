export const aircraftOptions = [
  "Cessna 172S",
  "Cessna 172N",
  "Cessna 152",
  "Piper Archer III (PA-28-181)",
  "Piper Warrior II (PA-28-161)",
  "Diamond DA40 NG",
  "Other / confirm with my POH",
] as const;

export type Profile = {
  id: string;
  display_name: string | null;
  checkride_date: string | null;
  preferred_aircraft: string;
};

export function daysUntilDate(date: string | null, today = new Date()) {
  if (!date) return null;

  const target = new Date(`${date}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const current = new Date(today);
  current.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - current.getTime()) / 86_400_000);
}
