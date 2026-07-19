import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssessmentFromEvaluations,
  estimateHaikuCostMicrousd,
  oralRequestSchema,
  type OralEvaluation,
} from "../lib/oral-exam.ts";

const sessionKey = "5a1b9b2a-f75d-4fbb-9d89-25e1e8c2d57a";

test("oral request validation accepts each bounded action", () => {
  assert.equal(oralRequestSchema.safeParse({ action: "start", mode: "intermediate", questionCount: 10, sessionKey }).success, true);
  assert.equal(oralRequestSchema.safeParse({
    action: "evaluate", mode: "beginner", sessionKey, questionId: "weather-go-no-go",
    answer: "I would establish personal diversion triggers.", previousAnswer: null,
    followUpQuestion: null, attempt: 0,
  }).success, true);
  assert.equal(oralRequestSchema.safeParse({
    action: "unknown", mode: "checkride", sessionKey, questionId: "weather-go-no-go",
  }).success, true);
});

test("oral request validation rejects unsafe bounds", () => {
  assert.equal(oralRequestSchema.safeParse({ action: "start", mode: "intermediate", questionCount: 100, sessionKey }).success, false);
  assert.equal(oralRequestSchema.safeParse({ action: "start", mode: "intermediate", questionCount: 10, sessionKey: "not-a-uuid" }).success, false);
  assert.equal(oralRequestSchema.safeParse({
    action: "evaluate", mode: "intermediate", sessionKey, questionId: "weather-go-no-go",
    answer: "a".repeat(3_001), previousAnswer: null, followUpQuestion: null, attempt: 0,
  }).success, false);
});

test("assessment is derived consistently from structured evaluations", () => {
  const evaluations: OralEvaluation[] = [
    {
      questionId: "weather-go-no-go", acsArea: "Weather Information", acsCode: "PA.I.C.R1",
      topic: "Weather decision-making", reference: "FAA-S-ACS-6C PA.I.C.R1",
      answer: "I would establish diversion triggers.", score: 90, verdict: "strong",
      feedback: "Sound weather decision-making.", demonstrated: ["Applied personal minimums"], missing: [],
      needsFollowUp: false, followUpQuestion: null,
    },
    {
      questionId: "fuel-system", acsArea: "Operation of Systems", acsCode: "PA.I.G.K1e",
      topic: "Fuel system", reference: "FAA-S-ACS-6C PA.I.G.K1e", answer: "I am not sure.",
      score: 40, verdict: "partial", feedback: "Review the fuel flow and usable fuel.", demonstrated: [],
      missing: ["Fuel flow and usable fuel"], needsFollowUp: false, followUpQuestion: null,
    },
  ];

  const assessment = buildAssessmentFromEvaluations(evaluations);
  assert.equal(assessment.overallScore, 65);
  assert.equal(assessment.readiness, "developing");
  assert.deepEqual(assessment.strengths, ["Weather Information: 90%"]);
  assert.equal(assessment.areasToReview[0]?.acsCode, "PA.I.G.K1e");
});

test("Haiku cost estimate accounts for cheaper cache reads", () => {
  assert.equal(estimateHaikuCostMicrousd(1_000, 500), 3_500);
  assert.equal(estimateHaikuCostMicrousd(0, 0, 1_000, 1_000), 1_350);
});
