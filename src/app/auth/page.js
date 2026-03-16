import { redirect } from 'next/navigation'
import { getSession } from '@/src/lib/auth'
import AuthForm from '@/src/components/AuthForm'

export const metadata = { title: 'Sign In — TaskFlow' }

export default async function AuthPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  return <AuthForm />
}
