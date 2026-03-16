import { NextResponse } from "next/server";
import { query } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/middleware";

// PATCH /api/tasks/[id]
export async function PATCH(request, { params }) {
  const auth = await requireAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();
  const { title, description, status, priority, due_date } = body;

  // Build dynamic update
  const fields = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(description);
  }
  if (status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(status);
  }
  if (priority !== undefined) {
    fields.push(`priority = $${idx++}`);
    values.push(priority);
  }
  if (due_date !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(due_date);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(id, auth.session.userId);

  const result = await query(
    `UPDATE tasks SET ${fields.join(", ")}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values,
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: result.rows[0] });
}

// DELETE /api/tasks/[id]
export async function DELETE(request, { params }) {
  const auth = await requireAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  const result = await query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, auth.session.userId],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
