import { NextResponse } from 'next/server'
import { query } from '@/src/lib/db'
import { requireAuth } from '@/src/lib/middleware'

// GET /api/tasks
export async function GET(request) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  let sql = `SELECT id, title, description, status, priority, due_date, created_at, updated_at
             FROM tasks WHERE user_id = $1`
  const params = [auth.session.userId]

  if (status) {
    params.push(status)
    sql += ` AND status = $${params.length}`
  }
  if (priority) {
    params.push(priority)
    sql += ` AND priority = $${params.length}`
  }

  sql += ' ORDER BY created_at DESC'

  const result = await query(sql, params)
  return NextResponse.json({ tasks: result.rows })
}

// POST /api/tasks
export async function POST(request) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { title, description, priority, due_date } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [auth.session.userId, title.trim(), description || null, priority || 'medium', due_date || null]
    )

    return NextResponse.json({ task: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Create task error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
