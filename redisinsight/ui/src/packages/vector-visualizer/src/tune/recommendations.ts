import type { VectorMetric } from '../contracts'

export type TuneConfidence = 'high' | 'medium' | 'low'

export interface TuneRecommendation {
  parameter: string
  currentValue: unknown
  suggestedRange?: string
  guidance: string
  impact: string
  confidence: TuneConfidence
}

export interface VectorSetProfile {
  count?: number
  dimensions?: number
  metric?: VectorMetric
  m?: number
  efConstruction?: number
  efRuntime?: number
}

export interface SearchIndexProfile {
  count?: number
  dimensions?: number
  metric?: VectorMetric
  algorithm?: string
  m?: number
  efConstruction?: number
  efRuntime?: number
}

const SMALL_INDEX_LIMIT = 10_000
const LARGE_INDEX_LIMIT = 100_000
const HIGH_DIMENSION_THRESHOLD = 256
const VERY_HIGH_DIMENSION_THRESHOLD = 512
const DEFAULT_M = 16
const MAX_JUSTIFIED_M = 64
const DEFAULT_EF_CONSTRUCTION = 200
const LOW_RECALL_THRESHOLD = 0.9

const CONFIDENCE_WEIGHT: Record<TuneConfidence, number> = {
  high: 2,
  medium: 1,
  low: 0,
}

const sortByConfidenceDesc = (
  recommendations: TuneRecommendation[],
): TuneRecommendation[] =>
  [...recommendations].sort(
    (left, right) =>
      CONFIDENCE_WEIGHT[right.confidence] - CONFIDENCE_WEIGHT[left.confidence],
  )

interface SizeGuidance {
  suggestedRange: string
  guidance: string
  confidence: TuneConfidence
}

const efRuntimeGuidanceForSize = (count: number): SizeGuidance => {
  if (count < SMALL_INDEX_LIMIT)
    return {
      suggestedRange: '100-150',
      guidance:
        'Small indexes (under 10K vectors) typically reach high recall with EF_RUNTIME around 100.',
      confidence: 'medium',
    }
  if (count < LARGE_INDEX_LIMIT)
    return {
      suggestedRange: '200-300',
      guidance:
        'Medium indexes (10K-100K vectors) usually need EF_RUNTIME near 200 to keep recall above 95%.',
      confidence: 'medium',
    }
  return {
    suggestedRange: '300+',
    guidance:
      'Large indexes (over 100K vectors) often require EF_RUNTIME of 300 or more to preserve recall.',
    confidence: 'medium',
  }
}

const mGuidanceForDimensions = (dimensions?: number): SizeGuidance => {
  if (dimensions === undefined)
    return {
      suggestedRange: `${DEFAULT_M}`,
      guidance: 'M=16 is a safe default when dimensionality is unknown.',
      confidence: 'low',
    }
  if (dimensions > VERY_HIGH_DIMENSION_THRESHOLD)
    return {
      suggestedRange: '32-64',
      guidance:
        'Very high-dimensional vectors (over 512) benefit from higher connectivity; M=32-64 trades memory for recall.',
      confidence: 'medium',
    }
  if (dimensions > HIGH_DIMENSION_THRESHOLD)
    return {
      suggestedRange: '32',
      guidance:
        'High-dimensional vectors (over 256) typically need M=32 to maintain graph connectivity.',
      confidence: 'medium',
    }
  return {
    suggestedRange: `${DEFAULT_M}`,
    guidance:
      'M=16 is the default and is usually sufficient below 256 dimensions.',
    confidence: 'high',
  }
}

const lowRecallRecommendation = (
  benchmarkRecall: number,
  efRuntime?: number,
): TuneRecommendation => ({
  parameter: 'EF_RUNTIME',
  currentValue: efRuntime,
  guidance:
    `Measured recall (${benchmarkRecall}) is below the ${LOW_RECALL_THRESHOLD} target; ` +
    'increase EF_RUNTIME to improve it.',
  impact: 'Raising EF_RUNTIME trades query latency for better recall.',
  confidence: 'high',
})

const excessiveMRecommendation = (m: number): TuneRecommendation => ({
  parameter: 'M',
  currentValue: m,
  suggestedRange: `${MAX_JUSTIFIED_M}`,
  guidance: `M above ${MAX_JUSTIFIED_M} is rarely justified and mostly adds memory overhead.`,
  impact: 'Lowering M reduces memory usage with minimal recall loss.',
  confidence: 'low',
})

export const recommendVectorSetTuning = (
  profile: VectorSetProfile,
  benchmarkRecall?: number,
): TuneRecommendation[] => {
  const recommendations: TuneRecommendation[] = []
  const count = profile.count ?? 0

  const efRuntime = efRuntimeGuidanceForSize(count)
  recommendations.push({
    parameter: 'EF_RUNTIME',
    currentValue: profile.efRuntime,
    suggestedRange: efRuntime.suggestedRange,
    guidance: efRuntime.guidance,
    impact: 'Higher EF_RUNTIME improves recall at the cost of query latency.',
    confidence: efRuntime.confidence,
  })

  const mGuidance = mGuidanceForDimensions(profile.dimensions)
  recommendations.push({
    parameter: 'M',
    currentValue: profile.m,
    suggestedRange: mGuidance.suggestedRange,
    guidance: mGuidance.guidance,
    impact:
      'Higher M improves recall but increases memory usage and build time.',
    confidence: mGuidance.confidence,
  })

  if (profile.m !== undefined && profile.m > MAX_JUSTIFIED_M)
    recommendations.push(excessiveMRecommendation(profile.m))

  if (benchmarkRecall !== undefined && benchmarkRecall < LOW_RECALL_THRESHOLD)
    recommendations.push(
      lowRecallRecommendation(benchmarkRecall, profile.efRuntime),
    )

  return sortByConfidenceDesc(recommendations)
}

export const recommendSearchIndexTuning = (
  profile: SearchIndexProfile,
): TuneRecommendation[] => {
  const recommendations: TuneRecommendation[] = []
  const count = profile.count ?? 0

  const efRuntime = efRuntimeGuidanceForSize(count)
  recommendations.push({
    parameter: 'EF_RUNTIME',
    currentValue: profile.efRuntime,
    suggestedRange: efRuntime.suggestedRange,
    guidance: efRuntime.guidance,
    impact:
      'Higher EF_RUNTIME improves query-time recall at the cost of latency.',
    confidence: efRuntime.confidence,
  })

  recommendations.push({
    parameter: 'EF_CONSTRUCTION',
    currentValue: profile.efConstruction,
    suggestedRange: `${DEFAULT_EF_CONSTRUCTION}+`,
    guidance:
      'EF_CONSTRUCTION controls build-time graph quality; 200 is a reasonable starting point for most workloads.',
    impact: 'Higher EF_CONSTRUCTION improves recall but slows index building.',
    confidence: 'medium',
  })

  const mGuidance = mGuidanceForDimensions(profile.dimensions)
  recommendations.push({
    parameter: 'M',
    currentValue: profile.m,
    suggestedRange: mGuidance.suggestedRange,
    guidance: mGuidance.guidance,
    impact:
      'Higher M improves recall but increases memory usage and build time.',
    confidence: mGuidance.confidence,
  })

  if (profile.m !== undefined && profile.m > MAX_JUSTIFIED_M)
    recommendations.push(excessiveMRecommendation(profile.m))

  return sortByConfidenceDesc(recommendations)
}
