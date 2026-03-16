import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/middleware";

// GET /api/profile
export async function GET() {
  const auth = await requireAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await query(
    `SELECT id, name, email, avatar_color, created_at,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'done') as done_tasks,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'in_progress') as in_progress_tasks,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'todo') as todo_tasks
     FROM users WHERE id = $1`,
    [auth.session.userId],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: result.rows[0] });
}

// PATCH /api/profile
export async function PATCH(request) {
  const auth = await requireAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { name, avatar_color, current_password, new_password } =
      await request.json();

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (avatar_color) {
      fields.push(`avatar_color = $${idx++}`);
      values.push(avatar_color);
    }

    // Handle password change
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 },
        );
      }
      const userResult = await query(
        "SELECT password_hash FROM users WHERE id = $1",
        [auth.session.userId],
      );
      const valid = await bcrypt.compare(
        current_password,
        userResult.rows[0].password_hash,
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }
      const newHash = await bcrypt.hash(new_password, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(newHash);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    fields.push(`updated_at = NOW()`);
    values.push(auth.session.userId);

    const result = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, avatar_color`,
      values,
    );

    return NextResponse.json({ profile: result.rows[0] });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
