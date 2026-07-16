import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import {
  AI_REQUESTS_PER_DAY,
  AI_REQUESTS_PER_MINUTE,
  ORAL_MODEL,
  buildSystemPrompt,
  estimateHaikuCostMicrousd,
  oralRequestSchema,
  oralResponseSchema,
} from "@/lib/oral-exam";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function usageCountSince(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  since: Date
) {
  return supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json(
      { error: "You must be signed in to use the AI oral examiner." },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = oralRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The oral-session request was invalid." },
      { status: 400 }
    );
  }

  const { messages, mode, questionCount, sessionKey } = parsed.data;
  const transcriptCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0
  );

  if (transcriptCharacters > 60_000) {
    return NextResponse.json(
      { error: "This session is too long to continue. Save it and begin a new session." },
      { status: 413 }
    );
  }

  const now = Date.now();
  const [minuteUsage, dailyUsage] = await Promise.all([
    usageCountSince(supabase, userId, new Date(now - 60_000)),
    usageCountSince(supabase, userId, new Date(now - 86_400_000)),
  ]);

  if (minuteUsage.error || dailyUsage.error) {
    console.error("Unable to read AI usage limits", minuteUsage.error ?? dailyUsage.error);
    return NextResponse.json(
      { error: "AI usage tracking is not configured yet. Run the latest Supabase migration." },
      { status: 503 }
    );
  }

  if ((minuteUsage.count ?? 0) >= AI_REQUESTS_PER_MINUTE) {
    return NextResponse.json(
      { error: "You are sending answers too quickly. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if ((dailyUsage.count ?? 0) >= AI_REQUESTS_PER_DAY) {
    return NextResponse.json(
      { error: "You have reached today's AI practice limit. Try another study mode for now." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("preferred_aircraft")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to load AI profile", profileError);
    return NextResponse.json(
      { error: "Your study profile is not configured yet. Run the latest Supabase migration." },
      { status: 503 }
    );
  }

  const aircraftModel = profile?.preferred_aircraft || "Cessna 172S";

  try {
    const response = await anthropic.messages.parse({
      model: ORAL_MODEL,
      max_tokens: 1_600,
      system: buildSystemPrompt(mode, questionCount, aircraftModel),
      messages,
      output_config: {
        format: zodOutputFormat(oralResponseSchema),
      },
    });

    const result = response.parsed_output;
    if (!result) {
      throw new Error(`No structured output returned; stop reason: ${response.stop_reason}`);
    }

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cacheCreationTokens = response.usage.cache_creation_input_tokens ?? 0;
    const cacheReadTokens = response.usage.cache_read_input_tokens ?? 0;
    const estimatedCostMicrousd = estimateHaikuCostMicrousd(inputTokens, outputTokens);

    const { error: usageError } = await supabase.from("ai_usage").insert({
      user_id: userId,
      session_key: sessionKey,
      request_id: response.id,
      request_kind: result.completed ? "oral_assessment" : "oral_turn",
      model: response.model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_creation_input_tokens: cacheCreationTokens,
      cache_read_input_tokens: cacheReadTokens,
      estimated_cost_microusd: estimatedCostMicrousd,
    });

    if (usageError) {
      console.error("Unable to store AI usage", usageError);
    }

    return NextResponse.json({
      ...result,
      aircraftModel,
      usage: {
        inputTokens,
        outputTokens,
        estimatedCostMicrousd,
      },
    });
  } catch (error) {
    console.error("AI oral examiner request failed", error);
    return NextResponse.json(
      { error: "The AI examiner could not respond. Your session is still saved in this browser." },
      { status: 502 }
    );
  }
}
