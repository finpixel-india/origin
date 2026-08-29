"use client";

import { useMemo, useState } from "react";
import { useStore, type BucketItem, type BucketStatus } from "@/lib/store";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  GlassCard,
  Modal,
  Progress,
  Ring,
  SectionLabel,
  TextArea,
  TextInput,
  badgeTone,
} from "@/components/ui";
import { uid } from "@/lib/id";
import { formatMedium } from "@/lib/date";

const STATUSES: BucketStatus[] = ["Dream", "Planning", "In Progress", "Completed"];

const CAT_EMOJI: Record<string, string> = {
  Travel: "✈️",
  Body: "💪",
  Craft: "🎨",
  Work: "💼",
  Learn: "📚",
  Adventure: "🏔️",
  Food: "🍷",
  Family: "🌌",
  Finance: "💰",
  Soul: "🧘",
};

const COVERS = [
  "linear-gradient(135deg, #2a2140, #14121f)",
  "linear-gradient(135deg, #1c2a36, #10161c)",
  "linear-gradient(135deg, #2e241b, #181310)",
  "linear-gradient(135deg, #1f2a23, #10160f)",
  "linear-gradient(135deg, #2b1c2e, #14101a)",
];

function coverFor(item: BucketItem, i: number) {
  return COVERS[i % COVERS.length];
}

const blank = (): BucketItem => ({
  id: uid(),
  title: "",
  description: "",
  category: "Travel",
  progress: 0,
  targetDate: "",
  status: "Dream",
  notes: "",
  imageUrl: "",
  createdAt: new Date().toISOString(),
});

export default function BucketPage() {
  const { bucket, setBucket } = useStore();
  const [filter, setFilter] = useState<"All" | BucketStatus>("All");
  const [editing, setEditing] = useState<BucketItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const visible = useMemo(() => {
    const list = filter === "All" ? bucket : bucket.filter((b) => b.status === filter);
    // Completed dreams rise to the top — achievements lead the collection.
    return [...list].sort((a, b) => {
      const aDone = a.status === "Completed" ? 0 : 1;
      const bDone = b.status === "Completed" ? 0 : 1;
      if (aDone !== bDone) return aDone - bDone;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [bucket, filter]);

  /** Tick / untick an experience as completed. */
  const toggleComplete = (item: BucketItem) =>
    setBucket((prev) =>
      prev.map((b) =>
        b.id === item.id
          ? b.status === "Completed"
            ? { ...b, status: "In Progress" as BucketStatus }
            : { ...b, status: "Completed" as BucketStatus, progress: 100 }
          : b
      )
    );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: bucket.length };
    for (const s of STATUSES) c[s] = bucket.filter((b) => b.status === s).length;
    return c;
  }, [bucket]);

  const openNew = () => {
    setEditing(blank());
    setIsNew(true);
  };
  const openEdit = (item: BucketItem) => {
    setEditing({ ...item });
    setIsNew(false);
  };
  const save = () => {
    if (!editing) return;
    setBucket((prev) => {
      const exists = prev.some((b) => b.id === editing.id);
      return exists ? prev.map((b) => (b.id === editing.id ? editing : b)) : [...prev, editing];
    });
    setEditing(null);
  };
  const remove = (id: string) => setBucket((prev) => prev.filter((b) => b.id !== id));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Bucket List</SectionLabel>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium text-silver-50">
            The life ahead
          </h1>
          <p className="mt-1 text-sm text-silver-500">
            A collection of future experiences, not a task list.
          </p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New experience
        </Button>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition ${
              filter === s
                ? "border-amethyst-400/40 bg-amethyst-500/15 text-amethyst-100"
                : "border-white/10 text-silver-500 hover:text-silver-200"
            }`}
          >
            {s} <span className="ml-1 text-silver-600">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing here yet"
            subtitle="Dream boldly. Add the experiences you want to collect in this lifetime."
            action={<Button variant="primary" onClick={openNew}>Add your first dream</Button>}
          />
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, i) => {
            const done = item.status === "Completed";
            return (
            <GlassCard
              key={item.id}
              className={`group lift cv-auto flex flex-col overflow-hidden transition-colors ${
                done ? "border-emerald-300/25 bg-emerald-300/[0.045]" : ""
              }`}
            >
              <div
                className="relative h-28 overflow-hidden"
                style={{
                  background: item.imageUrl ? undefined : coverFor(item, i),
                }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className={`h-full w-full object-cover transition group-hover:scale-105 ${
                      done ? "opacity-100" : "opacity-80 group-hover:opacity-90"
                    }`}
                  />
                ) : (
                  <div className={`grid h-full place-items-center text-4xl transition ${done ? "" : "opacity-90"}`}>
                    {CAT_EMOJI[item.category] ?? "✨"}
                  </div>
                )}
                <div
                  className={`absolute inset-0 ${
                    done
                      ? "bg-gradient-to-t from-black/45 to-emerald-300/10"
                      : "bg-gradient-to-t from-black/60 to-transparent"
                  }`}
                />
                <div className="absolute bottom-2 left-3 text-[0.6rem] uppercase tracking-[0.2em] text-silver-300">
                  {item.category}
                </div>

                {/* Completion tick */}
                <button
                  onClick={() => toggleComplete(item)}
                  title={done ? "Mark as not completed" : "Mark as completed"}
                  aria-label={done ? "Mark as not completed" : "Mark as completed"}
                  className={`press absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full border backdrop-blur-sm transition ${
                    done
                      ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-100"
                      : "border-white/25 bg-black/40 text-transparent hover:border-emerald-300/50 hover:text-emerald-200/60"
                  }`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className={`transition-transform duration-300 ${done ? "scale-100" : "scale-75"}`}
                  >
                    <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="absolute right-2 top-2">
                  <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className={`font-serif text-xl ${done ? "text-emerald-50" : "text-silver-100"}`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-silver-500">{item.description}</p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Ring value={item.progress} size={48} stroke={5} tone={done ? "emerald" : "amethyst"}>
                    <span className="text-[0.62rem] font-medium text-silver-200">{item.progress}%</span>
                  </Ring>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.66rem] text-silver-500">Progress</div>
                    <Progress value={item.progress} className="mt-1 h-1" tone={done ? "silver" : "amethyst"} />
                  </div>
                </div>

                {item.targetDate && (
                  <p className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-silver-600">
                    Target · {formatMedium(item.targetDate)}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-silver-300 transition hover:border-amethyst-400/40 hover:text-amethyst-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-silver-600 transition hover:border-red-400/30 hover:text-red-300/80"
                    aria-label="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? "New experience" : "Edit experience"}
        wide
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Title">
              <TextInput
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Travel to Japan"
                autoFocus
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What makes this worth doing?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <TextInput
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="Travel"
                />
              </Field>
              <Field label="Status">
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as BucketStatus })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-silver-100 outline-none focus:border-amethyst-400/50"
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target date">
                <TextInput
                  type="date"
                  value={editing.targetDate}
                  onChange={(e) => setEditing({ ...editing, targetDate: e.target.value })}
                />
              </Field>
              <Field label="Image URL" hint="optional">
                <TextInput
                  value={editing.imageUrl}
                  onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
            </div>
            <Field label="Notes">
              <TextArea
                rows={2}
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                placeholder="Steps, ideas, contacts…"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save} disabled={!editing.title.trim()}>
                {isNew ? "Add to list" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
