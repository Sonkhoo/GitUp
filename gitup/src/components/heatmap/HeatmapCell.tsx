import { useState } from 'react';
import { getHeatmapLevel, DayData } from '@/types/todo';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, isToday, isFuture, parseISO } from 'date-fns';

interface HeatmapCellProps {
  date: string;
  dayData: DayData;
  onDateClick: (date: string) => void;
}

export const HeatmapCell = ({ date, dayData, onDateClick }: HeatmapCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dateObj = parseISO(date);
  const isCurrentDay = isToday(dateObj);
  const isFutureDay = isFuture(dateObj);
  const level = isFutureDay ? -1 : getHeatmapLevel(dayData.completedCount, dayData.todos.length);

  const getCellClass = () => {
    if (isFutureDay) return 'heatmap-cell-future';
    switch (level) {
      case 0:
        return 'heatmap-cell-empty';
      case 1:
        return 'heatmap-cell-level-1';
      case 2:
        return 'heatmap-cell-level-2';
      case 3:
        return 'heatmap-cell-level-3';
      case 4:
        return 'heatmap-cell-level-4';
      default:
        return 'heatmap-cell-empty';
    }
  };

  const formattedDate = format(dateObj, 'MMM d, yyyy');
  const dayName = format(dateObj, 'EEEE');

  const completedTodos = dayData.todos.filter(t => t.isCompleted).length;

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen} delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={() => !isFutureDay && onDateClick(date)}
          disabled={isFutureDay}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={cn(
            'heatmap-cell cursor-pointer',
            getCellClass(),
            isFutureDay && 'cursor-not-allowed opacity-50'
          )}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
          }}
          aria-label={`${formattedDate}: ${dayData.completedCount} todos completed`}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="p-2 text-sm rounded-lg"
        style={{
          backgroundColor: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
        }}
      >
        <div className="text-center space-y-1">
          <p className="text-xs">{formattedDate}</p>
          <p className="font-mono text-sm">
            {dayData.completedCount}/{dayData.todos.length} todos completed
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
