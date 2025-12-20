/*
GET /api/heatmap/todos?year=2025           # Todo heatmap data
GET /api/heatmap/habits/:habitId?year=2025 # Habit heatmap data
GET /api/heatmap/user/:username?year=2025  # Other user's todo heatmap
*/
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { todos, habits, habitCompletions, user } from "@/lib/schema";
import { eq, and, isNull, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DayData, Todo } from "@/types/todo";

// GET /api/heatmap?year=2025
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get all todos for the year
    const userTodos = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, session.user.id),
          gte(todos.createdAt, yearStart),
          lte(todos.createdAt, yearEnd),
          isNull(todos.deletedAt)
        )
      );

    // Group todos by date
    const todosByDate = new Map<string, Todo[]>();

    userTodos.forEach((todo) => {
      const dateKey = todo.createdAt
        ? new Date(todo.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const todoItem: Todo = {
        id: todo.id.toString(),
        text: todo.title,
        date: dateKey,
        completed: !!todo.completedAt,
        completedAt: todo.completedAt?.toISOString(),
        createdAt: todo.createdAt?.toISOString() || new Date().toISOString(),
      };

      if (!todosByDate.has(dateKey)) {
        todosByDate.set(dateKey, []);
      }
      todosByDate.get(dateKey)!.push(todoItem);
    });

    // Convert to DayData array
    const heatmapData: DayData[] = Array.from(todosByDate.entries()).map(([date, dayTodos]) => ({
      date,
      completedCount: dayTodos.filter(t => t.completed).length,
      todos: dayTodos,
    }));

    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error("Get heatmap todos error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}