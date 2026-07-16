import { z } from "zod";

export const ORAL_MODEL = "claude-haiku-4-5-20251001";
export const ACS_VERSION = "FAA-S-ACS-6C";
export const AI_REQUESTS_PER_MINUTE = 12;
export const AI_REQUESTS_PER_DAY = 150;

export const oralModeSchema = z.enum(["beginner", "intermediate", "checkride"]);

export const oralMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(5_000),
});

export const oralRequestSchema = z.object({
  messages: z.array(oralMessageSchema).min(1).max(80),
  mode: oralModeSchema,
  questionCount: z.number().int().min(5).max(30),
  sessionKey: z.string().uuid(),
});

export const reviewAreaSchema = z.object({
  acsArea: z.string(),
  acsCode: z.string(),
  score: z.number().int().min(0).max(100),
  finding: z.string(),
  studyRecommendation: z.string(),
  reference: z.string(),
});

export const oralAssessmentSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  readiness: z.enum(["building-foundation", "developing", "nearly-ready", "checkride-ready"]),
  summary: z.string(),
  strengths: z.array(z.string()).max(6),
  areasToReview: z.array(reviewAreaSchema).max(10),
});

export const oralResponseSchema = z.object({
  reply: z.string(),
  completed: z.boolean(),
  questionNumber: z.number().int().min(0).max(30),
  assessment: oralAssessmentSchema.nullable(),
});

export type OralMode = z.infer<typeof oralModeSchema>;
export type OralMessage = z.infer<typeof oralMessageSchema>;
export type OralAssessment = z.infer<typeof oralAssessmentSchema>;
export type OralResponse = z.infer<typeof oralResponseSchema>;

const acsCategoryMap = `
Use only these official ${ACS_VERSION} category labels and task codes in the final assessment:
- Pilot Qualifications (PA.I.A)
- Airworthiness Requirements (PA.I.B)
- Weather Information (PA.I.C)
- Cross-Country Flight Planning (PA.I.D)
- National Airspace System (PA.I.E)
- Performance and Limitations (PA.I.F)
- Operation of Systems (PA.I.G)
- Human Factors (PA.I.H)
- Preflight Assessment (PA.II.A)
- Flight Deck Management (PA.II.B)

When possible, make acsCode more specific, such as PA.I.B.K3 for day/night VFR equipment or PA.I.G.K1f for the electrical system. Never invent a code. If you are unsure of a sub-element, use the verified task-level code listed above.`;

export function buildSystemPrompt(
  mode: OralMode,
  questionCount: number,
  aircraftModel: string
) {
  const modeInstructions: Record<OralMode, string> = {
    beginner: "Be patient and encouraging. Ask foundational questions, give direct guidance after weak answers, and suggest one way to strengthen correct answers.",
    intermediate: "Be professional and moderately demanding. Probe vague answers, use realistic scenarios, and give limited guidance when the student is stuck.",
    checkride: "Be concise and demanding. Do not give hints. Require precise, complete answers and probe statements that may reveal a knowledge gap.",
  };

  return `You are an AI study simulator conducting a Private Pilot airplane oral-exam practice session aligned to ${ACS_VERSION}. You are not an FAA evaluator and must never describe the result as an official pass or failure.

The student's preferred aircraft is ${aircraftModel}. Tailor aircraft-system questions to that model. Do not invent model-specific limitations, speeds, equipment, or procedures. When an exact value depends on serial number or configuration, tell the student to verify the applicable POH/AFM.

SESSION RULES
- Ask exactly one clear question at a time.
- Ask ${questionCount} scored questions total. Hints and targeted follow-ups do not count as new scored questions.
- Begin with a direct question. Do not introduce yourself with a fictional name.
- Mix factual knowledge, risk management, scenario application, aircraft systems, weather, regulations, airspace, performance, cross-country planning, and human factors.
- Keep an internal count by reviewing the transcript on every turn.
- If the user sends exactly HINT_REQUESTED, do not score it or advance the question count. In checkride mode, decline the hint. Otherwise provide a useful nudge and restate the current question.
- Distinguish aircraft documents from pilot documents. Maintenance records are not required to be carried aboard the aircraft.
- Never claim that a generated reference replaces current FAA publications or the applicable POH/AFM.

MODE
${modeInstructions[mode]}

ANSWER EVALUATION
- A complete answer should address the knowledge, risk-management, and scenario implications appropriate to the question.
- If an answer is partially correct, ask one targeted follow-up before moving on.
- Correct unsafe or materially incorrect advice clearly.
- Do not inflate scores. A polished but incomplete answer is not checkride-ready.

${acsCategoryMap}

OUTPUT CONTRACT
- reply contains only the natural-language message shown to the student.
- completed is false until the final scored question has been answered and evaluated.
- questionNumber is the number of scored questions completed so far.
- assessment must be null until completed is true.
- When completed is true, reply should briefly close the session and introduce the scorecard.
- The final assessment is a practice-readiness score, not an official FAA result.
- areasToReview must name the exact ACS categories where the transcript showed a gap. Include a specific finding, a concrete study action, and a reliable reference such as a CFR section, AIM section, PHAK chapter, Aviation Weather Handbook chapter, ${ACS_VERSION}, or the applicable ${aircraftModel} POH/AFM section.
- Include weak categories only in areasToReview. Put demonstrated strengths in strengths.`;
}

export function estimateHaikuCostMicrousd(inputTokens: number, outputTokens: number) {
  // Haiku 4.5 standard pricing: $1/MTok input and $5/MTok output.
  return inputTokens + outputTokens * 5;
}
