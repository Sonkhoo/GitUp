export interface Todo {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

export interface DayData {
  date: string;
  completedCount: number;
  todos: Todo[];
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export const getHeatmapLevel = (completedCount: number, totalCount: number): HeatmapLevel => {
  if (totalCount === 0) return 0;
  const percentage = completedCount / totalCount;
  if (percentage === 0) return 0;
  if (percentage <= 0.25) return 1;
  if (percentage <= 0.50) return 2;
  if (percentage <= 0.75) return 3;
  return 4; // 76-100%
};
