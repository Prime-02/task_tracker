"use client";
import { useState } from "react";
import styles from "./Dashboard.module.css";

export default function TaskModal({ task, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    due_date: task?.due_date
      ? new Date(task.due_date).toISOString().slice(0, 10)
      : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
    };
    if (isEdit) body.status = form.status;
    const ok = await onSave(body, isEdit ? task.id : null);
    setLoading(false);
    if (ok) onClose();
    else setError("Failed to save task. Please try again.");
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Edit Task" : "New Task"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Title *</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              placeholder="Add more details (optional)..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                <option value="low">🔵 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            {isEdit && (
              <div className={styles.field}>
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => update("due_date", e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Task"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
