"use client";
import useSWR from 'swr';
import { mutate } from 'swr';
import React, { useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { Heatmap } from "@/components/heatmap/TodoHeatmap";
import { DayData, Todo } from "@/types/todo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format, addDays } from "date-fns";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import "./todos.css";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TodosPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // SWR for todos - auto caches and deduplicates
  const { data: todos = [], isLoading: todosLoading, mutate: mutateTodos } = useSWR<Todo[]>(
    `/api/todo?date=${selectedDate}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  );

  // SWR for heatmap - auto caches and deduplicates
  const { data: heatmap = [], mutate: mutateHeatmap } = useSWR<DayData[]>(
    `/api/heatmap?year=${year}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

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
      isCompleted: false,
      userId: '',
      createdAt: selectedDate,
      completedAt: undefined,
      deletedAt: undefined,
    };

    // Update todos optimistically
    mutateTodos([...todos, optimisticTodo], false);

    // Update heatmap optimistically
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
      body: JSON.stringify({ title: newTodoTitle, date: selectedDate }),
    });

    if (res.ok) {
      // Revalidate both to get accurate data from server
      mutateTodos();
      mutateHeatmap();
      setNewTodoTitle("");
      inputRef.current?.focus();
    } else {
      // Rollback on error
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
    // Optimistic update
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, title: trimmed } : todo
    );
    mutateTodos(updatedTodos, false);
    // Optimistic update for heatmap
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
    // API call
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

  // Sort todos: incomplete first, then completed
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground pt-8">
        <main className="max-w-2xl mx-auto p-4">
          {/* Date selector */}
          <div className="flex items-center justify-between mb-4">
            <button
              className="text-lg"
              onClick={() => handleDateChange(-1)}
              aria-label="Previous Day"
            >
              <FaArrowLeft />
            </button>
            <div
              className="date-large text-center font-bold"
              style={{ color: 'hsl(var(--foreground))', fontSize: '2rem', letterSpacing: '0.01em' }}
            >
              {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
            </div>
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
            <h2 className="text-md font-bold mb-2">Todos</h2>
            <ul className="space-y-1 w-full max-w-sm">
              {sortedTodos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center w-full max-w-sm px-1 py-1 transition-all duration-150 ${todo.isCompleted ? 'todo-faded' : ''}`}
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
                  {editingId === todo.id ? (
                    <input
                      ref={editInputRef}
                      className={`flex-1 bg-transparent outline-none border-b border-border px-1 py-0.5 text-foreground text-sm todo-title${todo.isCompleted ? ' strike-lower completed-todo' : ''}`}
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
                    <span
                      className={`flex-1 text-left todo-title${todo.isCompleted ? ' strike-lower completed-todo' : ''}`}
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
                  )}
                  <button
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive transition-colors hit-area"
                    aria-label="Delete todo"
                    title="Delete"
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <FaTimes />
                  </button>
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