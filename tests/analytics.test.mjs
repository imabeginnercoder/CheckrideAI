import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryStats,
  buildScoreSeries,
  buildSpacedRepetitionQueue,
  scorePercentage,
} from "../utils/analytics.js";

test("scorePercentage handles normal and empty totals", () => {
  assert.equal(scorePercentage(8, 10), 80);
  assert.equal(scorePercentage(0, 0), 0);
});

test("buildCategoryStats aggregates correctness by category", () => {
  const stats = buildCategoryStats([
    { category: "Weather", correct: true },
    { category: "Weather", correct: false },
    { category: "Regulations", correct: true },
  ]);

  assert.deepEqual(stats, [
    { category: "Weather", correct: 1, total: 2, percentage: 50 },
    { category: "Regulations", correct: 1, total: 1, percentage: 100 },
  ]);
});

test("buildScoreSeries sorts scores chronologically and omits test runs", () => {
  const series = buildScoreSeries([
    { id: 2, created_at: "2026-07-03T00:00:00Z", score: 9, total_questions: 10, category: "Weather" },
    { id: 1, created_at: "2026-07-01T00:00:00Z", score: 7, total_questions: 10, category: "Practice Exam" },
    { id: 3, created_at: "2026-07-04T00:00:00Z", score: 1, total_questions: 1, category: "Test Run" },
  ]);

  assert.deepEqual(series.map((point) => [point.id, point.percentage]), [
    [1, 70],
    [2, 90],
  ]);
});

test("buildSpacedRepetitionQueue prioritizes weak or under-practiced categories", () => {
  const queue = buildSpacedRepetitionQueue([
    { category: "Weather", correct: 2, total: 10, percentage: 20 },
    { category: "Navigation", correct: 2, total: 2, percentage: 100 },
    { category: "Regulations", correct: 7, total: 10, percentage: 70 },
  ], 3);

  assert.equal(queue.length, 3);
  assert.equal(queue[0].category, "Weather");
  assert.equal(queue[1].category, "Regulations");
  assert.equal(queue[2].category, "Navigation");
});
