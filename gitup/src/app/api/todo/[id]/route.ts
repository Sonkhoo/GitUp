import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { todos } from "@/lib/schema";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { z } from "zod";


const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").transform(val => val.trim()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

// Unified toggle complete/incomplete
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
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
    const params = await context.params;
    const todoId = parseInt(params.id, 10);
    const body = await request.json().catch(() => ({}));
    // expects { completed: boolean }
    const { completed } = body;
    const updateData: any = {};
    if (typeof completed === "boolean") {
      updateData.isCompleted = completed;
      updateData.completedAt = completed ? new Date() : null;
    }
    await db
      .update(todos)
      .set(updateData)
      .where(
        and(
          eq(todos.id, todoId),
          eq(todos.userId, session.user.id)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle todo complete error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Soft delete todo
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
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
    const params = await context.params;
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

export const dynamic = 'force-dynamic'; // or 'auto' for conditional caching
export const revalidate = 0; // Disable caching for user-specific data