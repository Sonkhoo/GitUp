'use client';

import React, { useState, useEffect } from 'react';
import { Heatmap } from '@/components/heatmap/TodoHeatmap';
import { DayData, Todo } from '@/types/todo';
import { TooltipProvider } from '@/components/ui/tooltip';

// Sample data - replace with actual API calls later
const generateSampleData = (): Record<string, DayData> => {
  const data: Record<string, DayData> = {};
  const today = new Date();
  
  // Generate sample todos for the past 90 days
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Randomly generate todos for each day
    const todoCount = Math.floor(Math.random() * 5); // 0-4 todos per day
    const todos: Todo[] = [];
    
    for (let j = 0; j < todoCount; j++) {
      const completed = Math.random() > 0.3; // 70% completion rate
      todos.push({
        id: `${dateStr}-${j}`,
        text: `Sample todo ${j + 1}`,
        date: dateStr,
        completed,
        completedAt: completed ? new Date(date.getTime() + Math.random() * 86400000).toISOString() : undefined,
        createdAt: date.toISOString(),
      });
    }
    
    data[dateStr] = {
      date: dateStr,
      completedCount: todos.filter(t => t.completed).length,
      todos,
    };
  }
  
  return data;
};

function Page() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [todoData, setTodoData] = useState<Record<string, DayData>>({});
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Generate data only on client side to avoid hydration mismatch
    setIsClient(true);
    setTodoData(generateSampleData());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const getDayData = (date: string): DayData => {
    return todoData[date] || { date, completedCount: 0, todos: [] };
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    console.log('Clicked date:', date, getDayData(date));
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-8 min-h-screen bg-background text-foreground">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent"
          >
            {theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to GitUp</h1>
          <p className="text-muted-foreground">Track your daily progress with GitHub-style heatmaps</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Activity</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setYear(year - 1)}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-accent"
              >
                ← {year - 1}
              </button>
              <span className="font-mono text-sm">{year}</span>
              <button
                onClick={() => setYear(year + 1)}
                disabled={year >= new Date().getFullYear()}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {year + 1} →
              </button>
            </div>
          </div>

          <Heatmap
            getDayData={getDayData}
            onDateClick={handleDateClick}
            year={year}
          />
        </div>

        {selectedDate && (
          <div className="mt-6 bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">
              Todos for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="space-y-2">
              {getDayData(selectedDate).todos.length > 0 ? (
                getDayData(selectedDate).todos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      todo.completed ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {todo.completed && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={todo.completed ? 'line-through text-muted-foreground' : ''}>
                      {todo.text}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No todos for this day</p>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default Page;