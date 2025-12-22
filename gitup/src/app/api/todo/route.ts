/*
POST   /api/todos                   # Create new todo
GET    /api/todos?date=YYYY-MM-DD   # Get todos for date
PATCH  /api/todos/:id/complete      # Mark complete
PATCH  /api/todos/:id/uncomplete    # Mark incomplete
DELETE /api/todos/:id               # Soft delete todo
*/
import { revalidateTag } from 'next/cache';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { todos } from "@/lib/schema";
import { eq, and, isNull, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").transform(val => val.trim()),
  description: z.string().max(1000, "Description too long").optional().transform(val => val?.trim()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

// Create new todo
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = todoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, date, description } = result.data;

    const [newTodo] = await db.insert(todos).values({
      title,
      description,
      userId: session.user.id,
      createdAt: new Date()
    }).returning();
           revalidateTag(`todos-${session.user.id}-${date}`, 'auto');
      revalidateTag(`heatmap-${session.user.id}-${new Date(date ?? '').getFullYear()}`, 'auto');
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Get todos for a date
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
    const dateParam = searchParams.get("date") || new Date().toISOString().split('T')[0];
    const userTodos = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, session.user.id),
          gte(todos.createdAt, new Date(`${dateParam}T00:00:00.000Z`)),
          lte(todos.createdAt, new Date(`${dateParam}T23:59:59.999Z`)),
          isNull(todos.deletedAt)
        )
      )
      .orderBy(desc(todos.createdAt)); // Sort todos by creation time in descending order

    return NextResponse.json(userTodos);
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}



export const dynamic = 'force-dynamic'; // or 'auto' for conditional caching
export const revalidate = 0; // Disable caching for user-specific data