import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateHaikuCostMicrousd,
  oralRequestSchema,
  oralResponseSchema,
} from "../lib/oral-exam.ts";

const request = {
  messages: [{ role: "user", content: "Begin the oral examination." }],
  mode: "intermediate",
  questionCount: 10,
  sessionKey: "5a1b9b2a-f75d-4fbb-9d89-25e1e8c2d57a",
};

test("oral request validation accepts a bounded authenticated-session payload", () => {
  assert.equal(oralRequestSchema.safeParse(request).success, true);
});

test("oral request validation rejects unsafe question counts and session keys", () => {
  assert.equal(oralRequestSchema.safeParse({ ...request, questionCount: 100 }).success, false);
  assert.equal(oralRequestSchema.safeParse({ ...request, sessionKey: "not-a-uuid" }).success, false);
});

test("oral response requires an assessment when assessment data is provided", () => {
  const response = oralResponseSchema.safeParse({
    reply: "That concludes the practice session.",
    completed: true,
    questionNumber: 10,
    assessment: {
      overallScore: 76,
      readiness: "nearly-ready",
      summary: "Good risk-management thinking with a few systems gaps.",
      strengths: ["Weather decision making"],
      areasToReview: [{
        acsArea: "Operation of Systems",
        acsCode: "PA.I.G",
        score: 62,
        finding: "Electrical-system failure indications were incomplete.",
        studyRecommendation: "Trace the alternator failure checklist and system diagram.",
        reference: "Applicable POH/AFM, Airplane and Systems Description",
      }],
    },
  });

  assert.equal(response.success, true);
});

test("Haiku cost estimate is stored in micro-US-dollars", () => {
  assert.equal(estimateHaikuCostMicrousd(1_000, 500), 3_500);
});
