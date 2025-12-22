"use client";
import "./todos.css";
import useSWR from 'swr';
import React, { useState, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { FaTimes, FaRegStickyNote, FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import { DayData, Todo } from "@/types/todo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format, addDays } from "date-fns";
import confetti from "canvas-confetti";
import { Highlighter } from "@/components/ui/highlighter";
// Lazy load heavy components
const Heatmap = lazy(() => 
  import("@/components/heatmap/TodoHeatmap").then(mod => ({ default: mod.Heatmap }))
);
const UserWelcome = lazy(() => 
  import('@/components/profile/UserWelcome').then(mod => ({ default: mod.UserWelcome }))
);

// Optimized fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Skeleton loaders
const TodoSkeleton = () => (
  <div className="flex items-center w-full max-w-sm animate-pulse">
    <div className="w-8 h-8 bg-muted rounded-full mr-2" />
    <div className="flex-1 h-4 bg-muted rounded" />
  </div>
);

const HeatmapSkeleton = () => (
  <div className="w-full max-w-5xl h-32 bg-muted rounded animate-pulse" />
);

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

export default function TodosPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [descEditId, setDescEditId] = useState<number | null>(null);
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const editInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  // Optimized SWR configuration with better caching
  const swrConfig = useMemo(() => ({
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
    keepPreviousData: true, // Keep old data while loading new data
    revalidateIfStale: false,
  }), []);

  // SWR for todos with optimized config
  const { data: todosRaw = [], isLoading: todosLoading, mutate: mutateTodos } = useSWR(
    `/api/todo?date=${selectedDate}`,
    fetcher,
    swrConfig
  );

  const todos = useMemo(() => Array.isArray(todosRaw) ? todosRaw : [], [todosRaw]);

  // SWR for heatmap with longer cache time
  const { data: heatmapRaw = [], mutate: mutateHeatmap } = useSWR(
    `/api/heatmap?year=${year}`,
    fetcher,
    { ...swrConfig, dedupingInterval: 10000 }
  );

  const heatmap = useMemo(() => Array.isArray(heatmapRaw) ? heatmapRaw : [], [heatmapRaw]);

  // Memoized helper function
  const getDayData = useCallback((date: string): DayData => {
    return heatmap.find((d) => d.date === date) || {
      date,
      completedCount: 0,
      todos: [],
    };
  }, [heatmap]);

  // Optimized date change handler
  const handleDateChange = useCallback((days: number) => {
    const newDate = format(addDays(new Date(selectedDate), days), "yyyy-MM-dd");
    setSelectedDate(newDate);
    const newYear = new Date(newDate).getFullYear();
    if (newYear !== year) {
      setYear(newYear);
    }
  }, [selectedDate, year]);

  // Optimized confetti with debounce
  const triggerConfetti = useCallback(() => {
    const colors = ["#63a167ff", "#ffffff"];
    const end = Date.now() + 1500; // Reduced to 1.5 seconds
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 35,
        startVelocity: 40,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 35,
        startVelocity: 40,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  const handleAddTodo = useCallback(async () => {
    if (!newTodoTitle.trim()) return;

    const optimisticTodo: Todo = {
      id: Date.now(),
      title: newTodoTitle,
      description: newTodoDescription || "",
      isCompleted: false,
      userId: '',
      createdAt: selectedDate,
      completedAt: undefined,
      deletedAt: undefined,
    };

    // Optimistic updates
    mutateTodos([...todos, optimisticTodo], false);
    
    // Clear inputs immediately for better UX
    setNewTodoTitle("");
    setNewTodoDescription("");
    inputRef.current?.focus();

    try {
      const res = await fetch(`/api/todo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newTodoTitle, 
          date: selectedDate, 
          description: newTodoDescription.trim() 
        }),
      });

      if (res.ok) {
        mutateTodos();
        mutateHeatmap();
      } else {
        // Rollback on error
        mutateTodos();
      }
    } catch (error) {
      mutateTodos();
    }
  }, [newTodoTitle, editingDescription, selectedDate, todos, mutateTodos, mutateHeatmap]);

  const handleToggleComplete = useCallback(async (todoId: number, completed: boolean) => {
    const updatedTodos = todos.map(todo =>
      todo.id === todoId
        ? { ...todo, isCompleted: !completed, completedAt: !completed ? new Date().toISOString() : undefined }
        : todo
    );

    mutateTodos(updatedTodos, false);

    if (!completed) {
      triggerConfetti();
    }

    try {
      const res = await fetch(`/api/todo/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        mutateTodos();
        mutateHeatmap();
      } else {
        mutateTodos();
      }
    } catch (error) {
      mutateTodos();
    }
  }, [todos, mutateTodos, mutateHeatmap, triggerConfetti]);

  const handleDeleteTodo = useCallback(async (todoId: number) => {
    const updatedTodos = todos.filter(todo => todo.id !== todoId);
    mutateTodos(updatedTodos, false);

    try {
      const res = await fetch(`/api/todo/${todoId}`, { method: "DELETE" });
      if (res.ok) {
        mutateTodos();
        mutateHeatmap();
      } else {
        mutateTodos();
      }
    } catch (error) {
      mutateTodos();
    }
  }, [todos, mutateTodos, mutateHeatmap]);

  const handleStartEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleRenameTodo = useCallback(async (todoId: number) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) return;

    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, title: trimmed } : todo
    );

    mutateTodos(updatedTodos, false);
    setEditingId(null);
    setEditingTitle("");

    try {
      await fetch(`/api/todo/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      mutateTodos();
      mutateHeatmap();
    } catch (error) {
      mutateTodos();
    }
  }, [editingTitle, todos, mutateTodos, mutateHeatmap]);

  const handleEditDescription = useCallback((todo: Todo) => {
    setDescEditId(todo.id);
    setEditingDescription(todo.description || "");
  }, []);

  const handleSaveDescription = useCallback(async (todoId: number) => {
    const trimmed = editingDescription.trim();
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, description: trimmed } : todo
    );

    mutateTodos(updatedTodos, false);
    setDescEditId(null);
    setEditingDescription("");

    try {
      await fetch(`/api/todo/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });
      mutateTodos();
      mutateHeatmap();
    } catch (error) {
      mutateTodos();
    }
  }, [editingDescription, todos, mutateTodos, mutateHeatmap]);

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen flex flex-col items-center py-8 px-4">
        <main className="w-full max-w-3xl flex flex-col items-center">
          {/* Date selector */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => handleDateChange(-1)}
              aria-label="Previous Day"
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              <FaArrowLeft />
            </button>
            <Highlighter color='#b3ea9dff' padding={6} strokeWidth={1.7} animationDuration={1500} action='underline'>
            <h2 className="date-large">
              {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
            </h2>
            </Highlighter>
            <button
              onClick={() => handleDateChange(1)}
              aria-label="Next Day"
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              <FaArrowRight />
            </button>
          </div>

          {/* Todos list with loading state */}
          <div className="w-full max-w-md mt-4 mb-4">
            <ul className="space-y-2">
              {todosLoading && todos.length === 0 ? (
                <>
                  <TodoSkeleton />
                  <TodoSkeleton />
                  <TodoSkeleton />
                </>
              ) : (
                todos.map((todo) => (
                  <li key={todo.id} className="flex flex-col w-full">
                    <div className="flex items-center w-full max-w-sm" style={{ minHeight: '32px' }}>
                      <button
                        className={`todo-circle flex-shrink-0 hit-area ${
                          todo.isCompleted ? 'done' : ''
                        }`}
                        onClick={() => handleToggleComplete(todo.id, todo.isCompleted)}
                        aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        style={{ padding: 0 }}
                      >
                        <span
                          className="circle-inner"
                          style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {todo.isCompleted && <FaCheck style={{ color: '#68af5d' }} size={12} />}
                        </span>
                      </button>

                      {editingId === todo.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          className="todo-title flex-1"
                          value={editingTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditingTitle(e.target.value)
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameTodo(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleRenameTodo(todo.id)} // Confirm changes on blur
                          maxLength={200}
                        />
                      ) : (
                        <div className="flex items-center flex-1 gap-2">
                          <span
                            className={`todo-title flex-1 cursor-pointer ${
                              todo.isCompleted ? 'strike-lower completed-todo' : ''
                            }`}
                            style={{ fontFamily: 'var(--font-caveat)', fontWeight: 400 }}
                            onClick={() => handleStartEdit(todo)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') handleStartEdit(todo);
                            }}
                            aria-label="Rename todo"
                          >
                            {todo.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDescription(todo);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={0}
                            onKeyDown={e => {
                              e.stopPropagation();
                              if (e.key === 'Enter' || e.key === ' ') handleEditDescription(todo);
                            }}
                          >
                            <FaRegStickyNote size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="w-full max-w-sm" style={{ paddingLeft: '38px' }}>
                      {descEditId === todo.id ? (
                    <textarea
                      ref={descRef}
                      className="todo-description w-full resize-none bg-transparent border border-border rounded px-2 py-1"
                      value={editingDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditingDescription(e.target.value)
                      }
                      onBlur={() => handleSaveDescription(todo.id)} // Confirm changes on blur
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveDescription(todo.id);
                        }
                        if (e.key === 'Escape') setDescEditId(null);
                      }}
                      maxLength={1000}
                      rows={1}
                      autoFocus
                    />
                      ) : (
                        <>
                          {todo.description && (
                            <div
                              className={`todo-description text-xs italic mb-1 transition-all duration-200 cursor-pointer group/desc ${
                                todo.isCompleted ? 'completed-todo' : 'text-muted-foreground'
                              }`}
                              style={{
                                fontFamily: 'var(--font-caveat), cursive',
                                fontWeight: 400,
                                alignItems: 'center',
                                display: 'flex',
                                minHeight: '1.3rem',
                                marginTop: 0,
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label="Edit description"
                              onClick={() => handleEditDescription(todo)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') handleEditDescription(todo);
                              }}
                            >
                              {todo.description}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))
              )}

              {/* Add todo input */}
              <li className="flex items-center w-full max-w-sm mt-1" style={{ minHeight: '32px' }}>
                <button
                  className="todo-circle flex-shrink-0 mr-2 text-muted-foreground hover:bg-muted transition-colors hit-area"
                  onClick={() => inputRef.current?.focus()}
                  aria-label="Add todo"
                  tabIndex={-1}
                >
                  <span
                    className="circle-inner"
                    style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #888', display: 'block' }}
                  />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="todo-title flex-1"
                  placeholder="Add a todo..."
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTodo();
                  }}
                  onBlur={handleAddTodo} // Confirm addition on blur
                  maxLength={200}
                />
              </li>
            </ul>
          </div>
        </main>

        {/* Heatmap with lazy loading */}
        <div className="w-full flex justify-center items-center mt-8 px-2">
          <Suspense fallback={<HeatmapSkeleton />}>
            <div className="heatmap-container w-full max-w-5xl flex justify-center">
              <Heatmap
                getDayData={getDayData}
                onDateClick={setSelectedDate}
                year={year}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </TooltipProvider>
  );
}