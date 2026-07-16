import type { SupabaseClient } from "@supabase/supabase-js";

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
  onboarding_completed?: boolean;
};

type UserProfileSource = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function profileFromUserMetadata(user: UserProfileSource): Profile {
  const metadata = user.user_metadata ?? {};
  const date = metadataString(metadata, "checkride_date");

  return {
    id: user.id,
    display_name: metadataString(metadata, "display_name"),
    checkride_date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    preferred_aircraft: metadataString(metadata, "preferred_aircraft") ?? "Cessna 172S",
  };
}

export function mergeProfileWithUserMetadata(existing: Profile | null, user: UserProfileSource): Profile {
  const metadataProfile = profileFromUserMetadata(user);
  const profileLooksUninitialized = !existing?.display_name && !existing?.checkride_date;

  return {
    id: user.id,
    display_name: existing?.display_name || metadataProfile.display_name,
    checkride_date: existing?.checkride_date || metadataProfile.checkride_date,
    preferred_aircraft: profileLooksUninitialized
      ? metadataProfile.preferred_aircraft
      : existing?.preferred_aircraft ?? metadataProfile.preferred_aircraft,
    onboarding_completed: existing?.onboarding_completed ?? false,
  };
}

export async function syncProfileFromUser(supabase: SupabaseClient, user: UserProfileSource) {
  const profile = profileFromUserMetadata(user);
  return supabase.from("profiles").upsert({
    id: profile.id,
    display_name: profile.display_name,
    checkride_date: profile.checkride_date,
    preferred_aircraft: profile.preferred_aircraft,
  }, { onConflict: "id" });
}

export function daysUntilDate(date: string | null, today = new Date()) {
  if (!date) return null;

  const target = new Date(`${date}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const current = new Date(today);
  current.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - current.getTime()) / 86_400_000);
}
