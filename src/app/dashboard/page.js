import { redirect } from 'next/navigation'
import { getSession } from '@/src/lib/auth'
import { query } from '@/src/lib/db'
import Dashboard from '@/src/components/Dashboard'

export const metadata = { title: 'Dashboard — TaskFlow' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/auth')

  const [userResult, tasksResult] = await Promise.all([
    query('SELECT id, name, email, avatar_color FROM users WHERE id = $1', [session.userId]),
    query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [session.userId]
    ),
  ])

  const user = userResult.rows[0]
  const tasks = tasksResult.rows

  return <Dashboard user={user} initialTasks={tasks} />
}
