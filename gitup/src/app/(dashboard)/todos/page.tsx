"use client";
import "./todos.css";
import useSWR from 'swr';
import { mutate } from 'swr';
import React, { useState, useRef } from "react";
import { FaTimes, FaRegStickyNote } from "react-icons/fa";
import { Heatmap } from "@/components/heatmap/TodoHeatmap";
import { DayData, Todo } from "@/types/todo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format, addDays, parseISO, isValid } from "date-fns";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import confetti from "canvas-confetti"
import { Highlighter } from "@/components/ui/highlighter"
import { UserWelcome } from '@/components/profile/UserWelcome';
import { authClient } from "@/lib/auth-client";
import { redirect } from 'next/dist/client/components/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TodosPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [descEditId, setDescEditId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // SWR for todos - auto caches and deduplicates
  const { data: todosRaw = [], isLoading: todosLoading, mutate: mutateTodos } = useSWR<Todo[]>(
    `/api/todo?date=${selectedDate}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  );

  // Ensure todos is always an array
  const todos = Array.isArray(todosRaw) ? todosRaw : [];

  // //Session hook
  //  const {
  //   data: session,
  //   isPending,
  //   error,
  //   refetch,
  // } = authClient.useSession();

  // // Redirect if not logged in (client-side)
  // React.useEffect(() => {
  //   if (!isPending && !session) {
  //     window.location.href = "/login";
  //   }
  // }, [isPending, session]);
  

  // SWR for heatmap - auto caches and deduplicates

  const { data: heatmapRaw = [], mutate: mutateHeatmap } = useSWR<DayData[]>(
    `/api/heatmap?year=${year}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
  // Ensure heatmap is always an array
  const heatmap = Array.isArray(heatmapRaw) ? heatmapRaw : [];

  const getDayData = (date: string): DayData => {
    return (
      heatmap.find((d) => d.date === date ) || {
        date,
        completedCount: 0,
        todos: [],
      }
    );
  };


  const handleDateChange = (days: number) => {
    const newDate = format(addDays(new Date(selectedDate), days), "yyyy-MM-dd");
    setSelectedDate(newDate);
    if (new Date(newDate).getFullYear() !== year) {
      setYear(new Date(newDate).getFullYear());
    }
  };

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;

    // Optimistic update for todos
    const optimisticTodo = {
      id: Date.now(), // temporary ID
      title: newTodoTitle,
      description: editingDescription || "",
      isCompleted: false,
      userId: '',
      createdAt: selectedDate,
      completedAt: undefined,
      deletedAt: undefined,
    };

    mutateTodos([...todos, optimisticTodo], false);
    mutateHeatmap(
      heatmap.map(day =>
        day.date === selectedDate
          ? { ...day, todos: [...day.todos, optimisticTodo] }
          : day
      ),
      false
    );

    // Make API call
    const res = await fetch(`/api/todo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTodoTitle, date: selectedDate, description: editingDescription }),
    });

    if (res.ok) {
      mutateTodos();
      mutateHeatmap();
      setNewTodoTitle("");
      setEditingDescription("");
      inputRef.current?.focus();
    } else {
      mutateTodos();
      mutateHeatmap();
    }
  };

  const handleToggleComplete = async (todoId: number, completed: boolean) => {
    // Optimistic update for todos
    const updatedTodos = todos.map(todo =>
      todo.id === todoId
        ? { ...todo, isCompleted: !completed, completedAt: !completed ? new Date().toISOString() : undefined }
        : todo
    );
    mutateTodos(updatedTodos, false);

    // Trigger confetti burst if marking as completed
    if (!completed) {
      const colors = ["#63a167ff", "#ffffff"];
      const end = Date.now() + 2 * 1000; // 2 seconds

      const frame = () => {
        if (Date.now() > end) return;
        confetti({
          particleCount: 1,
          angle: 60,
          spread: 35,
          startVelocity: 40,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 1,
          angle: 120,
          spread: 35,
          startVelocity: 40,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });
        requestAnimationFrame(frame);
      };
      frame();
    }

    // Optimistic update for heatmap
    const updatedHeatmap = heatmap.map(day => {
      if (day.date === selectedDate) {
        const updatedDayTodos = day.todos.map(todo =>
          todo.id === todoId ? { ...todo, isCompleted: !completed } : todo
        );
        const newCompletedCount = updatedDayTodos.filter(t => t.isCompleted).length;
        return { ...day, todos: updatedDayTodos, completedCount: newCompletedCount };
      }
      return day;
    });
    mutateHeatmap(updatedHeatmap, false);

    // Make API call
    const res = await fetch(`/api/todo/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });

    if (res.ok) {
      // Revalidate to get accurate data
      mutateTodos();
      mutateHeatmap();
    } else {
      // Rollback on error
      mutateTodos();
      mutateHeatmap();
    }
  };

  // Delete todo handler
  const handleDeleteTodo = async (todoId: number) => {
    // Optimistic update for todos
    const updatedTodos = todos.filter(todo => todo.id !== todoId);
    mutateTodos(updatedTodos, false);

    // Optimistic update for heatmap
    const updatedHeatmap = heatmap.map(day => {
      if (day.date === selectedDate) {
        const updatedDayTodos = day.todos.filter(todo => todo.id !== todoId);
        const newCompletedCount = updatedDayTodos.filter(t => t.isCompleted).length;
        return { ...day, todos: updatedDayTodos, completedCount: newCompletedCount };
      }
      return day;
    });
    mutateHeatmap(updatedHeatmap, false);

    // Make API call
    const res = await fetch(`/api/todo/${todoId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      mutateTodos();
      mutateHeatmap();
    } else {
      // Rollback on error
      mutateTodos();
      mutateHeatmap();
    }
  };

  // Start editing a todo
  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 0);
  };

  // Submit rename
  const handleRenameTodo = async (todoId: number) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) return;
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, title: trimmed } : todo
    );
    mutateTodos(updatedTodos, false);
    const updatedHeatmap = heatmap.map(day => {
      if (day.date === selectedDate) {
        const updatedDayTodos = day.todos.map(todo =>
          todo.id === todoId ? { ...todo, title: trimmed } : todo
        );
        return { ...day, todos: updatedDayTodos };
      }
      return day;
    });
    mutateHeatmap(updatedHeatmap, false);
    await fetch(`/api/todo/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    mutateTodos();
    mutateHeatmap();
    setEditingId(null);
    setEditingTitle("");
  };

  // Edit description
  const handleEditDescription = (todo: Todo) => {
    setDescEditId(todo.id);
    setEditingDescription(todo.description || "");
  };

  const handleSaveDescription = async (todoId: number) => {
    const trimmed = editingDescription.trim();
    // Optimistic update
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, description: trimmed } : todo
    );
    mutateTodos(updatedTodos, false);
    const updatedHeatmap = heatmap.map(day => {
      if (day.date === selectedDate) {
        const updatedDayTodos = day.todos.map(todo =>
          todo.id === todoId ? { ...todo, description: trimmed } : todo
        );
        return { ...day, todos: updatedDayTodos };
      }
      return day;
    });
    mutateHeatmap(updatedHeatmap, false);
    await fetch(`/api/todo/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: trimmed }),
    });
    mutateTodos();
    mutateHeatmap();
    setDescEditId(null);
    setEditingDescription("");
  };


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground pt-8">
        <main className="max-w-2xl mx-auto p-4">
          {/* Date selector */}
          <div className="flex items-center justify-between mb-12">
            <button
              className="text-lg"
              onClick={() => handleDateChange(-1)}
              aria-label="Previous Day"
            >
              <FaArrowLeft />
            </button>
            <Highlighter color='#b3ea9dff' padding={6} strokeWidth={1.7} animationDuration={1500} action='underline'>
            <div
              className="date-large text-center font-bold"
              style={{ color: 'hsl(var(--foreground))', fontSize: '2rem', letterSpacing: '0.01em' }}
            >
              {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
            </div>
            </Highlighter>
            <button
              className="text-lg"
              onClick={() => handleDateChange(1)}
              aria-label="Next Day"
            >
              <FaArrowRight />
            </button>
          </div>

          {/* Todos list */}
          <div className="flex flex-col items-center mb-8 w-full">
            {/* <h2 className="text-md font-bold mb-2">Todos</h2> */}
            <ul className="space-y-1 w-full max-w-sm" style={{ fontFamily: "var(--font-covered-by-your-grace)", fontSize: "40px" }} >
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`group flex items-start w-full max-w-sm px-1 py-2 transition-all duration-150 ${todo.isCompleted ? 'todo-faded' : ''}`}
                  style={{ minHeight: '32px' }}
                >
                  <button
                    className={`todo-circle flex-shrink-0 mr-2 transition-colors hit-area ${todo.isCompleted ? 'done' : ''}`}
                    onClick={() => handleToggleComplete(todo.id, todo.isCompleted)}
                    aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <span className="circle-inner" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {todo.isCompleted && <FaCheck className="text-[11px] text-[#68af5d]" />}
                    </span>
                  </button>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      {editingId === todo.id ? (
                        <input
                          ref={editInputRef}
                          className={`bg-transparent outline-none border-b border-border px-1 py-0.5 text-foreground text-sm todo-title${todo.isCompleted ? ' strike-lower completed-todo' : ''}`}
                          style={todo.isCompleted ? { opacity: 0.6, transform: 'translateY(2px)', textDecoration: 'line-through' } : {}}
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameTodo(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          maxLength={200}
                        />
                      ) : (
                        <div className="flex justify-end items-center w-full gap-1">
                          <span
                            className={`text-left todo-title${todo.isCompleted ? ' strike-lower completed-todo' : ''}`}
                            style={todo.isCompleted ? { opacity: 0.6, transform: 'translateY(2px)', textDecoration: 'line-through' } : {}}
                            tabIndex={0}
                            onClick={() => handleStartEdit(todo)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') handleStartEdit(todo);
                            }}
                            role="button"
                            aria-label="Rename todo"
                          >
                            {todo.title}
                          </span>
                          <button
                            className="ml-1 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted/60 align-middle"
                            aria-label={todo.description ? "Edit description" : "Add description"}
                            title={todo.description ? "Edit description" : "Add description"}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            onClick={e => { e.stopPropagation(); handleEditDescription(todo); }}
                            tabIndex={0}
                            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') handleEditDescription(todo); }}
                          >
                            <FaRegStickyNote style={{ fontSize: 15, marginRight: 0, color: 'rgba(120,120,120,0.35)' }} />
                          </button>
                          <button
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors hit-area"
                            aria-label="Delete todo"
                            title="Delete"
                            style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => handleDeleteTodo(todo.id)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Description row, visually separated and cozy */}
                    <div className="relative mt-2">
                      {descEditId === todo.id ? (
                        <textarea
                          className="w-full bg-transparent outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground rounded-lg animate-fade-in"
                          placeholder="Add a description..."
                          value={editingDescription}
                          onChange={e => setEditingDescription(e.target.value)}
                          onBlur={() => handleSaveDescription(todo.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveDescription(todo.id); }
                            if (e.key === 'Escape') setDescEditId(null);
                          }}
                          maxLength={1000}
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <>
                          {todo.description && (
                            <div
                              className="text-xs italic text-muted-foreground mb-1 transition-all duration-200 cursor-pointer group/desc"
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
                  </div>
                </li>
              ))}
              <li className="flex items-center w-full max-w-sm mt-1" style={{ minHeight: '32px' }}>
                <button
                  className="todo-circle flex-shrink-0 mr-2 text-muted-foreground hover:bg-muted transition-colors hit-area"
                  onClick={() => inputRef.current?.focus()}
                  aria-label="Add todo"
                  tabIndex={-1}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  <span className="circle-inner" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #888', display: 'block' }}></span>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent outline-none border-b border-border px-1 py-0.5 text-foreground text-sm"
                  placeholder="Add a todo..."
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTodo();
                  }}
                  maxLength={200}
                />
              </li>
            </ul>
          </div>
        </main>

        {/* Heatmap */}
        <div className="w-full flex justify-center items-center mt-8 px-2">
          <div className="heatmap-container w-full max-w-5xl flex justify-center">
            <Heatmap
              getDayData={getDayData}
              onDateClick={setSelectedDate}
              year={year}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}