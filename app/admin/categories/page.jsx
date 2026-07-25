"use client";

import { useEffect, useState } from "react";

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [rowError, setRowError] = useState({});

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(data.error || "Could not create category");
      return;
    }
    setNewName("");
    load();
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditValue(category.name);
    setRowError((prev) => ({ ...prev, [category.id]: "" }));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(category) {
    const name = editValue.trim();
    if (!name || name === category.name) {
      cancelEdit();
      return;
    }

    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setRowError((prev) => ({ ...prev, [category.id]: data.error || "Could not save" }));
      return;
    }
    cancelEdit();
    load();
  }

  async function remove(category) {
    const count = category._count?.videos || 0;
    const message =
      count > 0
        ? `Remove "${category.name}"? It's assigned to ${count} video${count === 1 ? "" : "s"} — this only removes the category, not the videos.`
        : `Remove "${category.name}"?`;
    if (!confirm(message)) return;

    await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    load();
  }

  if (!categories) return <p className="story-meta">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "'Archivo Narrow', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Categories ({categories.length})
        </h1>
      </div>

      <form onSubmit={createCategory} className="story-card p-3 flex gap-2 items-start mb-4">
        <div className="flex-1">
          <input
            className="input text-[13px] w-full"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {createError && (
            <p className="story-meta mt-1" style={{ color: "var(--signal)" }}>
              {createError}
            </p>
          )}
        </div>
        <button className="btn btn-primary text-[12px] py-1" type="submit" disabled={creating}>
          {creating ? "Adding…" : "+ Add category"}
        </button>
      </form>

      {categories.length === 0 && (
        <div className="panel text-center py-12">
          <p className="story-meta mb-2">No categories yet</p>
          <p style={{ color: "var(--ink-soft)" }} className="text-sm">
            Add one above to start categorizing stories.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <div key={category.id} className="story-card p-3 flex gap-3 items-center">
            <div className="flex-1 min-w-0">
              {editingId === category.id ? (
                <input
                  className="input text-[13px] w-full"
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(category);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              ) : (
                <p className="story-headline text-[14px]">{category.name}</p>
              )}
              <p className="story-meta mt-1" style={{ fontSize: "10px" }}>
                {category.slug} &nbsp;·&nbsp; {category._count?.videos || 0} video
                {category._count?.videos === 1 ? "" : "s"}
              </p>
              {rowError[category.id] && (
                <p className="story-meta mt-1" style={{ color: "var(--signal)" }}>
                  {rowError[category.id]}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {editingId === category.id ? (
                <>
                  <button className="btn btn-primary text-[12px] py-1" onClick={() => saveEdit(category)}>
                    Save
                  </button>
                  <button className="btn btn-outline text-[12px] py-1" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline text-[12px] py-1" onClick={() => startEdit(category)}>
                    Rename
                  </button>
                  <button
                    className="btn btn-danger-outline text-[12px] py-1"
                    onClick={() => remove(category)}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
