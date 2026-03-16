'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Dashboard.module.css'
import TaskModal from './TaskModal'
import Avatar from './Avatar'

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const PRIORITY_COLORS = { low: 'var(--blue)', medium: 'var(--amber)', high: 'var(--red)' }
const STATUS_COLORS = { todo: 'var(--text-3)', in_progress: 'var(--amber)', done: 'var(--green)' }

export default function Dashboard({ user, initialTasks }) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const filtered = useMemo(() => tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [tasks, filter, priorityFilter, search])

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  }), [tasks])

  async function handleSaveTask(data, id) {
    const isEdit = !!id
    const res = await fetch(isEdit ? `/api/tasks/${id}` : '/api/tasks', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return false
    const json = await res.json()
    if (isEdit) {
      setTasks(ts => ts.map(t => t.id === id ? json.task : t))
    } else {
      setTasks(ts => [json.task, ...ts])
    }
    return true
  }

  async function handleStatusChange(id, status) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { task } = await res.json()
      setTasks(ts => ts.map(t => t.id === id ? task : t))
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) setTasks(ts => ts.filter(t => t.id !== id))
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth')
    router.refresh()
  }

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <div className={styles.logo}>✦</div>
            <span>TaskFlow</span>
          </div>

          <nav className={styles.nav}>
            <button className={`${styles.navItem} ${styles.navActive}`}>
              <span>⊞</span> Dashboard
            </button>
            <button className={styles.navItem} onClick={() => setShowProfile(true)}>
              <span>◎</span> Profile
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard} onClick={() => setShowProfile(true)}>
            <Avatar name={user.name} color={user.avatar_color} size={34} />
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? '...' : '⎋ Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Good work, {user.name.split(' ')[0]} 👋</h1>
            <p className={styles.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className={styles.newBtn} onClick={() => { setEditTask(null); setShowModal(true) }}>
            + New Task
          </button>
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--accent)' },
            { label: 'To Do', value: stats.todo, color: 'var(--text-3)' },
            { label: 'In Progress', value: stats.in_progress, color: 'var(--amber)' },
            { label: 'Done', value: stats.done, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
          <div className={`${styles.statCard} ${styles.progressCard}`}>
            <div className={styles.progressHeader}>
              <span className={styles.statLabel}>Progress</span>
              <span className={styles.progressPct} style={{ color: 'var(--green)' }}>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            className={styles.search}
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.filterGroup}>
            {['all', 'todo', 'in_progress', 'done'].map(s => (
              <button key={s} className={filter === s ? styles.filterActive : styles.filterBtn} onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <select className={styles.prioritySelect} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Task list */}
        <div className={styles.taskList}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◌</div>
              <p>{tasks.length === 0 ? 'No tasks yet. Create your first one!' : 'No tasks match your filters.'}</p>
              {tasks.length === 0 && (
                <button className={styles.emptyBtn} onClick={() => setShowModal(true)}>+ Create Task</button>
              )}
            </div>
          ) : filtered.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onEdit={() => { setEditTask(task); setShowModal(true) }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      {showModal && (
        <TaskModal
          task={editTask}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditTask(null) }}
        />
      )}

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}

function TaskRow({ task, onStatusChange, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const nextStatus = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
  const statusIcon = { todo: '○', in_progress: '◑', done: '●' }

  return (
    <div className={styles.taskRow}>
      <button
        className={styles.statusBtn}
        style={{ color: STATUS_COLORS[task.status] }}
        onClick={() => onStatusChange(task.id, nextStatus[task.status])}
        title={`Mark as ${nextStatus[task.status]}`}
      >
        {statusIcon[task.status]}
      </button>

      <div className={styles.taskContent}>
        <div className={styles.taskTitle} style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}>
          {task.title}
        </div>
        {task.description && <div className={styles.taskDesc}>{task.description}</div>}
        <div className={styles.taskMeta}>
          <span className={styles.badge} style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] }}>
            {task.priority}
          </span>
          <span className={styles.badge} style={{ background: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status], borderColor: STATUS_COLORS[task.status] }}>
            {STATUS_LABELS[task.status]}
          </span>
          {task.due_date && (
            <span className={styles.dueDate}>
              📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className={styles.taskActions}>
        <button className={styles.actionBtn} onClick={onEdit} title="Edit">✎</button>
        <button className={styles.actionBtn} style={{ color: 'var(--red)' }} onClick={() => onDelete(task.id)} title="Delete">✕</button>
      </div>
    </div>
  )
}

function ProfileModal({ user, onClose }) {
  const [form, setForm] = useState({ name: user.name, avatar_color: user.avatar_color, current_password: '', new_password: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true); setMsg(''); setError('')
    const body = { name: form.name, avatar_color: form.avatar_color }
    if (form.new_password) { body.current_password = form.current_password; body.new_password = form.new_password }
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setMsg('Profile updated!'); router.refresh()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Profile</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.profilePreview}>
          <Avatar name={form.name || user.name} color={form.avatar_color} size={64} />
          <div>
            <div className={styles.profileName}>{form.name || user.name}</div>
            <div className={styles.profileEmail}>{user.email}</div>
          </div>
        </div>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.field}>
            <label>Display Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label>Avatar Color</label>
            <div className={styles.colorPicker}>
              {colors.map(c => (
                <button type="button" key={c} className={styles.colorSwatch}
                  style={{ background: c, outline: form.avatar_color === c ? `2px solid white` : 'none', outlineOffset: '2px' }}
                  onClick={() => setForm(f => ({ ...f, avatar_color: c }))} />
              ))}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.field}>
            <label>Current Password</label>
            <input type="password" placeholder="Leave blank to keep current" value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label>New Password</label>
            <input type="password" placeholder="Min. 6 characters" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {msg && <div className={styles.success}>{msg}</div>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
