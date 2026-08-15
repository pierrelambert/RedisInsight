export interface HybridScoreChartDocument {
  id: string
  textScore?: number
  vectorScore?: number
  hybridScore?: number
}

export interface HybridScoreChartProps {
  documents: HybridScoreChartDocument[]
}
