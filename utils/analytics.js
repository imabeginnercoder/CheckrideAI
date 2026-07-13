export function scorePercentage(score, total) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export function buildCategoryStats(results) {
  const categoryMap = {};

  results.forEach((result) => {
    if (!categoryMap[result.category]) {
      categoryMap[result.category] = { correct: 0, total: 0 };
    }
    categoryMap[result.category].total += 1;
    if (result.correct) categoryMap[result.category].correct += 1;
  });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
      percentage: (data.correct / data.total) * 100,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

export function buildScoreSeries(scores) {
  return scores
    .filter((score) => score.category !== "Test Run")
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((score) => ({
      id: score.id,
      label: new Date(score.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      category: score.category,
      percentage: scorePercentage(score.score, score.total_questions),
    }));
}

export function buildSpacedRepetitionQueue(categoryStats, limit = 4) {
  return categoryStats
    .map((stat) => {
      const lowScoreWeight = 100 - stat.percentage;
      const lowVolumeWeight = Math.max(0, 8 - stat.total) * 4;
      return {
        ...stat,
        priority: Math.round(lowScoreWeight + lowVolumeWeight),
        reason: stat.total < 5
          ? "Needs more attempts"
          : stat.percentage < 70
          ? "Below checkride target"
          : "Due for reinforcement",
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
