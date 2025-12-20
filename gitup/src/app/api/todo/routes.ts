/*
POST   /api/todos                   # Create new todo
GET    /api/todos?date=YYYY-MM-DD   # Get todos for date
PATCH  /api/todos/:id/complete      # Mark complete
PATCH  /api/todos/:id/uncomplete    # Mark incomplete
DELETE /api/todos/:id               # Soft delete todo
*/

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { todos } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").transform(val => val.trim()),
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

    const { title, date } = result.data;

    const [newTodo] = await db.insert(todos).values({
      title,
      userId: session.user.id,
      createdAt: date ? new Date(date) : new Date(),
    }).returning();

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
    const date = new Date(dateParam);

    const userTodos = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.userId, session.user.id),
          eq(todos.createdAt, date),
          isNull(todos.deletedAt)
        )
      );

    return NextResponse.json(userTodos);
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}


// Mark todo complete
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const todoId = parseInt(params.id, 10);

    await db
      .update(todos)
      .set({ completedAt: new Date() })
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, session.user.id)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark todo complete error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Mark todo uncomplete
export async function PATCH_UNCOMPLETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const todoId = parseInt(params.id, 10);
    await db
      .update(todos)
      .set({ completedAt: null })
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, session.user.id)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark todo uncomplete error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Soft delete todo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const todoId = parseInt(params.id, 10);

    await db
      .update(todos)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, session.user.id)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Soft delete todo error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}