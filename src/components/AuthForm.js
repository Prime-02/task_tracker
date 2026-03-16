'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AuthForm.module.css'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logo}>✦</div>
          <span>TaskFlow</span>
        </div>
        <div className={styles.hero}>
          <h1>Track what<br /><em>matters.</em></h1>
          <p>A clean, personal workspace to manage your tasks and stay on top of what counts.</p>
        </div>
        <div className={styles.features}>
          {['Personalized task boards', 'Priority & due dates', 'Progress tracking'].map(f => (
            <div key={f} className={styles.feature}>
              <span className={styles.check}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.tabs}>
            <button className={mode === 'login' ? styles.activeTab : styles.tab} onClick={() => { setMode('login'); setError('') }}>Sign In</button>
            <button className={mode === 'register' ? styles.activeTab : styles.tab} onClick={() => { setMode('register'); setError('') }}>Create Account</button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label>Full Name</label>
                <input type="text" placeholder="Jane Smith" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
            )}
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input type="password" placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
