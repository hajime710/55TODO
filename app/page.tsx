"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  priority: Priority;
  category: Category;
  dueDate: string | null;
};

const STORAGE_KEY = "todo-app:tasks:v2";

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; chip: string; ring: string }
> = {
  high: {
    label: "高",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    ring: "ring-rose-200 dark:ring-rose-900/60",
  },
  medium: {
    label: "中",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    ring: "ring-amber-200 dark:ring-amber-900/60",
  },
  low: {
    label: "低",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    ring: "ring-emerald-200 dark:ring-emerald-900/60",
  },
};

const CATEGORY_META: Record<Category, { label: string; chip: string }> = {
  work: {
    label: "仕事",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900",
  },
  private: {
    label: "プライベート",
    chip: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-900",
  },
  other: {
    label: "その他",
    chip: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700",
  },
};

const ALL_PRIORITIES: Priority[] = ["high", "medium", "low"];
const ALL_CATEGORIES: Category[] = ["work", "private", "other"];

function isOverdue(dueDate: string | null, done: boolean): boolean {
  if (!dueDate || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return due.getTime() < today.getTime();
}

function formatDue(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "明日";
  if (diffDays === -1) return "昨日";
  if (diffDays < 0) return `${-diffDays} 日前`;
  if (diffDays <= 6) return `${diffDays} 日後`;
  return `${due.getMonth() + 1}/${due.getDate()}`;
}

type ProgressRingProps = {
  done: number;
  total: number;
};

function ProgressRing({ done, total }: ProgressRingProps) {
  const size = 88;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total === 0 ? 0 : done / total;
  const offset = circumference * (1 - ratio);
  const percent = Math.round(ratio * 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-emerald-100 dark:text-emerald-950"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-500 dark:text-emerald-400 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
          {percent}%
        </span>
        <span className="text-[10px] text-stone-500 dark:text-stone-400 tabular-nums">
          {done}/{total}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("work");
  const [dueDate, setDueDate] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [hydrated, setHydrated] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const migrated: Todo[] = parsed.map((t) => ({
            id: typeof t.id === "string" ? t.id : crypto.randomUUID(),
            text: typeof t.text === "string" ? t.text : "",
            done: Boolean(t.done),
            createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
            priority: ALL_PRIORITIES.includes(t.priority)
              ? t.priority
              : "medium",
            category: ALL_CATEGORIES.includes(t.category) ? t.category : "other",
            dueDate: typeof t.dueDate === "string" ? t.dueDate : null,
          }));
          setTodos(migrated);
        }
      }
    } catch {
      // 破損データは無視
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
      priority,
      category,
      dueDate: dueDate || null,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
    setDueDate("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, done: !t.done };
        if (next.done) {
          setJustCompletedId(id);
          setTimeout(() => {
            setJustCompletedId((cur) => (cur === id ? null : cur));
          }, 700);
        }
        return next;
      })
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = useMemo(() => {
    return todos.filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    });
  }, [todos, filterPriority, filterCategory]);

  const sorted = useMemo(() => {
    const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    return [...filtered].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pr = priorityRank[a.priority] - priorityRank[b.priority];
      if (pr !== 0) return pr;
      return b.createdAt - a.createdAt;
    });
  }, [filtered]);

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <main className="w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5L10 17.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-300">
              Verdant ToDo
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {hydrated
                ? total === 0
                  ? "今日のタスクを追加しましょう"
                  : `残り ${total - doneCount} 件 / 全 ${total} 件`
                : " "}
            </p>
          </div>
        </header>

        {/* Progress card */}
        <section className="mb-8 flex items-center gap-5 rounded-2xl border border-emerald-100 bg-white/70 p-5 backdrop-blur dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <ProgressRing done={doneCount} total={total} />
          <div className="flex-1 grid grid-cols-3 gap-3 text-center">
            {ALL_PRIORITIES.map((p) => {
              const count = todos.filter(
                (t) => t.priority === p && !t.done
              ).length;
              return (
                <div
                  key={p}
                  className="rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-stone-200/70 dark:bg-stone-900 dark:ring-stone-800"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      優先度{PRIORITY_META[p].label}
                    </span>
                  </div>
                  <div className="mt-1 text-xl font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Input form */}
        <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTodo();
              }
            }}
            placeholder="やることを入力..."
            aria-label="新しいタスク"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-emerald-400 dark:focus:bg-stone-900 dark:focus:ring-emerald-400/20"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              aria-label="優先度"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
            >
              {ALL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  優先度: {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              aria-label="カテゴリ"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="締め切り"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:[color-scheme:dark]"
            />
            <button
              type="button"
              onClick={addTodo}
              disabled={!input.trim()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.97] disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-400 disabled:shadow-none dark:disabled:from-stone-700 dark:disabled:to-stone-700"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M7 2v10M2 7h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              追加
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">カテゴリ:</span>
            <FilterChip
              active={filterCategory === "all"}
              onClick={() => setFilterCategory("all")}
            >
              すべて
            </FilterChip>
            {ALL_CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                active={filterCategory === c}
                onClick={() => setFilterCategory(c)}
              >
                {CATEGORY_META[c].label}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">優先度:</span>
            <FilterChip
              active={filterPriority === "all"}
              onClick={() => setFilterPriority("all")}
            >
              すべて
            </FilterChip>
            {ALL_PRIORITIES.map((p) => (
              <FilterChip
                key={p}
                active={filterPriority === p}
                onClick={() => setFilterPriority(p)}
              >
                <span
                  className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${PRIORITY_META[p].dot}`}
                  aria-hidden="true"
                />
                {PRIORITY_META[p].label}
              </FilterChip>
            ))}
          </div>
        </section>

        <ul className="flex flex-col gap-2">
          {sorted.map((todo) => {
            const overdue = isOverdue(todo.dueDate, todo.done);
            const dueLabel = formatDue(todo.dueDate);
            return (
              <li
                key={todo.id}
                className={`group animate-fade-in-up flex items-start gap-3 rounded-xl border bg-white px-4 py-3 transition hover:border-emerald-300 hover:shadow-sm dark:bg-stone-900 dark:hover:border-emerald-700 ${
                  overdue
                    ? "border-rose-200 dark:border-rose-900/60"
                    : "border-stone-200 dark:border-stone-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={todo.done ? "未完了に戻す" : "完了にする"}
                  aria-pressed={todo.done}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    todo.done
                      ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950"
                      : "border-stone-300 hover:border-emerald-500 dark:border-stone-600 dark:hover:border-emerald-400"
                  } ${justCompletedId === todo.id ? "animate-shimmer" : ""}`}
                >
                  {todo.done && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      className={
                        justCompletedId === todo.id ? "animate-pop" : ""
                      }
                    >
                      <path
                        d="M2.5 6.5L5 9L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className={`break-words text-base ${
                      todo.done
                        ? "text-stone-400 dark:text-stone-600"
                        : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    <span className={todo.done ? "todo-line-through" : ""}>
                      {todo.text}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                        PRIORITY_META[todo.priority].chip
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          PRIORITY_META[todo.priority].dot
                        }`}
                        aria-hidden="true"
                      />
                      優先度 {PRIORITY_META[todo.priority].label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                        CATEGORY_META[todo.category].chip
                      }`}
                    >
                      {CATEGORY_META[todo.category].label}
                    </span>
                    {dueLabel && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                          overdue
                            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                            : "border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300"
                        }`}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <rect x="1" y="2" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1" />
                          <path d="M1 4h8M3.5 1v2M6.5 1v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        {overdue ? `期限超過 (${dueLabel})` : dueLabel}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="削除"
                  className="shrink-0 rounded-md p-1.5 text-stone-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9h5L11 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>

        {hydrated && total === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-12 text-center text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
            まだタスクはありません。最初のひとつを追加してみましょう
          </div>
        )}
        {hydrated && total > 0 && sorted.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            条件に合うタスクはありません
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition ${
        active
          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 dark:border-emerald-400 dark:bg-emerald-500"
          : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
      }`}
    >
      {children}
    </button>
  );
}
