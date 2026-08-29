"use client";

import { useMemo, useState } from "react";
import { useStore, type Project, type ProjectStatus, type WorkPriority } from "@/lib/store";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  GlassCard,
  Modal,
  Progress,
  SectionLabel,
  TextArea,
  TextInput,
  badgeTone,
} from "@/components/ui";
import { uid } from "@/lib/id";
import { formatMedium, diffInDays } from "@/lib/date";

const STATUSES: ProjectStatus[] = ["Not Started", "In Progress", "On Hold", "Done"];
const PRIORITIES: WorkPriority[] = ["Low", "Medium", "High", "Critical"];

const blank = (): Project => ({
  id: uid(),
  name: "",
  description: "",
  priority: "Medium",
  progress: 0,
  status: "Not Started",
  deadline: "",
  createdAt: new Date().toISOString(),
});

const selectClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-silver-100 outline-none focus:border-amethyst-400/50";

export default function WorkPage() {
  const { projects, setProjects } = useStore();
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);

  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.priority] - order[b.priority];
      }),
    [projects]
  );

  const openNew = () => {
    setEditing(blank());
    setIsNew(true);
  };
  const openEdit = (p: Project) => {
    setEditing({ ...p });
    setIsNew(false);
  };
  const save = () => {
    if (!editing) return;
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === editing.id);
      return exists ? prev.map((p) => (p.id === editing.id ? editing : p)) : [...prev, editing];
    });
    setEditing(null);
  };
  const remove = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  const activeCount = projects.filter((p) => p.status !== "Done").length;
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Work</SectionLabel>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium text-silver-50">
            Projects &amp; priorities
          </h1>
          <p className="mt-1 text-sm text-silver-500">
            {projects.length > 0
              ? `${activeCount} active · ${avgProgress}% average progress`
              : "Create only the projects that are real enough to matter."}
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New project
        </Button>
      </header>

      {sorted.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No projects yet"
            subtitle="Define what you are building. Structure is here to grow with you."
            action={<Button variant="primary" onClick={openNew}>Create a project</Button>}
          />
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          {sorted.map((p, i) => {
            const days = p.deadline ? diffInDays(p.deadline, new Date().toISOString().slice(0, 10)) : null;
            const overdue = days !== null && days < 0 && p.status !== "Done";
            return (
              <GlassCard key={p.id} className={`lift cv-auto p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl text-silver-100">{p.name}</h3>
                    {p.description && (
                      <p className="mt-1 text-sm text-silver-500">{p.description}</p>
                    )}
                  </div>
                  <Badge tone={badgeTone(p.priority)}>{p.priority}</Badge>
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-[0.66rem] text-silver-500">
                    <span>{p.status}</span>
                    <span className="font-medium text-silver-300">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.7rem] text-silver-600">
                  {p.deadline && (
                    <span className={`inline-flex items-center gap-1.5 ${overdue ? "text-red-300/80" : ""}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
                      </svg>
                      {overdue ? "Overdue · " : "Due · "}
                      {formatMedium(p.deadline)}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-silver-300 transition hover:border-amethyst-400/40 hover:text-amethyst-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-silver-600 transition hover:border-red-400/30 hover:text-red-300/80"
                    aria-label="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-[0.64rem] uppercase tracking-[0.24em] text-silver-700">
        Modular workspace · more work modules will arrive here
      </p>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? "New project" : "Edit project"}
        wide
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Project name">
              <TextInput
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="ORIGIN — Personal OS"
                autoFocus
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What is this project for?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <select
                  value={editing.priority}
                  onChange={(e) =>
                    setEditing({ ...editing, priority: e.target.value as WorkPriority })
                  }
                  className={selectClass}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="bg-ink-800">
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as ProjectStatus })
                  }
                  className={selectClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-ink-800">
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Progress" hint={`${editing.progress}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={editing.progress}
                onChange={(e) => setEditing({ ...editing, progress: Number(e.target.value) })}
                className="w-full accent-amethyst-500"
              />
            </Field>
            <Field label="Deadline">
              <TextInput
                type="date"
                value={editing.deadline}
                onChange={(e) => setEditing({ ...editing, deadline: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save} disabled={!editing.name.trim()}>
                {isNew ? "Create project" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
