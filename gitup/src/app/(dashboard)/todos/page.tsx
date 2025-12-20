"use client";
import { revalidate } from "@/app/api/todo/route";
import React, { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Heatmap } from "@/components/heatmap/TodoHeatmap";
import { DayData, Todo } from "@/types/todo";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format, addDays, subDays } from "date-fns";
import { FaArrowLeft, FaArrowRight, FaPlus, FaCheck } from "react-icons/fa";
import "./todos.css";
import { ModeToggle } from "@/components/ui/theme-toggle";


const fetchTodosForDate = async (date: string): Promise<Todo[]> => {
  const res = await fetch(`/api/todo?date=${date}`);
  if (!res.ok) {
    return [];
  }
  const todos = await res.json();
  console.log("Fetched todos for date", date, todos);
  return todos;
};

const fetchHeatmapData = async (year: number): Promise<DayData[]> => {
  const res = await fetch(`/api/heatmap?year=${year}`);
  if (!res.ok) {
    return [];
  }
  const resData = await res.json();
  return resData;
};

const createTodo = async (title: string, date: string) => {
  const res = await fetch(`/api/todo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, date }),
  });
  if (!res.ok) {
    console.error("Failed to create todo");
    return null;
  }
  return res.json();
};

const toggleTodoComplete = async (todoId: number, completed: boolean) => {
  const res = await fetch(`/api/todo/${todoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: !completed }),
  });
  if (!res.ok) {
    console.error("Failed to toggle todo complete");
    return false;
  }
  const resData = await res.json();
  console.log("Toggled todo complete", resData);
  return resData;
};


export default function TodosPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [heatmap, setHeatmap] = useState<DayData[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchTodosForDate(selectedDate).then(setTodos).finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    fetchHeatmapData(year).then(setHeatmap);
  }, [year]);

  const getDayData = (date: string): DayData => {
    return (
      heatmap.find((d) => d.date === date) || {
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

  const handleSignOut = () => {
    // Implement sign out logic here (e.g., call /api/auth/signout and redirect)
    window.location.href = "/api/auth/signout";
  };

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    const createdTodo = await createTodo(newTodoTitle, selectedDate);
    if (createdTodo) {
      // Optimistically update todos
      setTodos((prev) => [...prev, createdTodo]);
      setNewTodoTitle("");
      inputRef.current?.focus();
      // Re-fetch heatmap in background
      fetchHeatmapData(year).then(setHeatmap);
    }
  };

  const handleToggleComplete = async (todoId: number, completed: boolean) => {
    const success = await toggleTodoComplete(todoId, completed);
    if (!success) return;
    // Optimistically update todos
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, isCompleted: !completed, completedAt: !completed ? new Date().toISOString() : undefined } : todo
      )
    );
    // Re-fetch heatmap in background
    fetchHeatmapData(year).then(setHeatmap);
  };

  // Sort todos: incomplete first, then completed
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <>
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground pt-8">
        {/* <Navbar onSignOut={handleSignOut} /> */}
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
                  <span
                    className={`flex-1 text-left todo-title${todo.isCompleted ? ' strike-lower completed-todo' : ''}`}
                    style={todo.isCompleted ? { opacity: 0.6, transform: 'translateY(2px)', textDecoration: 'line-through' } : {}}
                  >
                    {todo.title}
                  </span>
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
        {/* Heatmap now outside main, spans screen */}
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
    </>
  );
}
