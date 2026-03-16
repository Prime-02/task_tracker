import { getSession } from './auth'

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized', status: 401 }
  }
  return { session }
}
