import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/src/lib/db'
import { setSessionCookie, createToken } from '@/src/lib/auth'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Pick a random avatar color
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
    const avatarColor = colors[Math.floor(Math.random() * colors.length)]

    const result = await query(
      `INSERT INTO users (name, email, password_hash, avatar_color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar_color, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, avatarColor]
    )

    const user = result.rows[0]
    const token = await createToken({ userId: user.id, email: user.email, name: user.name })
    await setSessionCookie(token)

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, avatarColor: user.avatar_color } }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
