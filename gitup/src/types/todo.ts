export interface Todo {
  id: number; // Matches the integer primary key in the schema
  userId: string; // Foreign key referencing the user
  title: string; // Updated to match the schema field name
  isCompleted: boolean; // Derived from the presence of completedAt
  completedAt?: string; // ISO timestamp for when the todo was completed
  createdAt: string; // ISO timestamp for when the todo was created
  deletedAt?: string; // ISO timestamp for soft deletion
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
