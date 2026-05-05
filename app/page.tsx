"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todo-app:tasks";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Todo[] = JSON.parse(raw);
        if (Array.isArray(parsed)) setTodos(parsed);
      }
    } catch {
      // 破損データは無視して空状態で開始
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
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
      <main className="w-full max-w-xl">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            ToDo
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            {hydrated
              ? todos.length === 0
                ? "タスクを追加してはじめましょう"
                : `残り ${remaining} 件 / 全 ${todos.length} 件`
              : " "}
          </p>
        </header>

        <div className="mb-8 flex gap-2">
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
            className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-stone-200 dark:focus:ring-stone-200/10"
          />
          <button
            type="button"
            onClick={addTodo}
            disabled={!input.trim()}
            className="shrink-0 rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            追加
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
            >
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.done ? "未完了に戻す" : "完了にする"}
                aria-pressed={todo.done}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  todo.done
                    ? "border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                    : "border-stone-300 hover:border-stone-500 dark:border-stone-600 dark:hover:border-stone-400"
                }`}
              >
                {todo.done && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
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
              <span
                className={`flex-1 break-words text-base ${
                  todo.done
                    ? "text-stone-400 line-through dark:text-stone-600"
                    : "text-stone-900 dark:text-stone-100"
                }`}
              >
                {todo.text}
              </span>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                aria-label="削除"
                className="shrink-0 rounded-md p-1.5 text-stone-400 opacity-0 transition hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-800 dark:hover:text-stone-200"
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
          ))}
        </ul>

        {hydrated && todos.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-stone-200 px-4 py-12 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-600">
            まだタスクはありません
          </div>
        )}
      </main>
    </div>
  );
}
