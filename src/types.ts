import type { Card } from 'ts-fsrs';

export type Difficulty = 'easy' | 'medium' | 'hard';
export interface AnalysisResult {
  title: string;
  difficulty: Difficulty;
  primaryPatternId: string;
  secondaryPatternIds: string[];
  coreInsight: string;
  skeleton: string;
  prerequisites: string[];
  warnings: string[];
}
export interface Problem {
  id: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  description: string;
  primaryPatternId: string;
  secondaryPatternIds: string[];
  aiAnalysis: Pick<AnalysisResult, 'coreInsight' | 'skeleton' | 'prerequisites' | 'warnings'>;
  codeDrafts: Record<string, string>;
  notes: string;
  fsrsCard: Card;
  createdAt: number;
  updatedAt: number;
}
export interface AIConfig { apiKey: string; baseUrl: string; model: string }
