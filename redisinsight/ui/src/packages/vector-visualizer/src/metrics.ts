export const redisSimilarityFromDistance = (distance: number): number => {
  if (!Number.isFinite(distance)) {
    return distance
  }

  const similarity = distance > 1 ? 2 - distance : 1 - distance

  return Math.max(0, Math.min(1, similarity))
}
