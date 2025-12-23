import { useMemo } from 'react';
import { HeatmapCell } from './HeatmapCell';
import { DayData } from '@/types/todo';
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
  addDays,
  isSameMonth,
} from 'date-fns';

interface HeatmapProps {
  getDayData: (date: string) => DayData;
  onDateClick: (date: string) => void;
  year?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const Heatmap = ({
  getDayData,
  onDateClick,
  year = new Date().getFullYear(),
}: HeatmapProps) => {
  const { weeks, monthLabels } = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Get all days in the year
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Organize into weeks (columns), starting with Sunday
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(7).fill(null);

    days.forEach(day => {
      const dayOfWeek = getDay(day);

      if (dayOfWeek === 0 && currentWeek.some(d => d !== null)) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }

      currentWeek[dayOfWeek] = day;
    });

    if (currentWeek.some(d => d !== null)) {
      weeks.push(currentWeek);
    }

    // Calculate month labels with positions
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIdx) => {
      const firstValidDay = week.find(d => d !== null);
      if (firstValidDay) {
        const month = firstValidDay.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex: weekIdx });
          lastMonth = month;
        }
      }
    });

    return { weeks, monthLabels: labels };
  }, [year]);

  return (
    <div className="overflow-x-auto scrollbar-thin mx-auto w-full sm:w-fit">
      <div className="inline-block p-2 sm:p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>
        {/* Year title */}
        <div className="mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {year} Contributions
          </h3>
        </div>

        {/* Month labels */}
        <div className="flex mb-1 sm:mb-2" style={{ paddingLeft: '20px' }}>
          <div className="flex" style={{ gap: '2px' }}>
            {monthLabels.map((label, idx) => {
              const nextLabel = monthLabels[idx + 1];
              const columnSpan = nextLabel ? nextLabel.weekIndex - label.weekIndex : weeks.length - label.weekIndex;
              return (
                <div
                  key={`${label.month}-${label.weekIndex}`}
                  className="text-[10px] sm:text-xs font-mono flex-shrink-0"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    width: `${columnSpan * 14}px`,
                    textAlign: 'left'
                  }}
                >
                  {label.month}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid with day labels */}
        <div className="flex" style={{ gap: '3px' }}>
          {/* Day labels - 7 rows, one per day */}
          <div className="flex flex-col mr-1 sm:mr-2" style={{ gap: '3px' }}>
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-[8px] sm:text-xs font-mono flex items-center justify-start flex-shrink-0"
                style={{
                  width: '16px',
                  height: '12px',
                  color: 'hsl(var(--muted-foreground))'
                }}
              >
                {day.slice(0, 1)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap: '3px' }}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col" style={{ gap: '3px' }}>
                {week.map((day, dayIndex) =>
                  day ? (
                    <HeatmapCell
                      key={format(day, 'yyyy-MM-dd')}
                      date={format(day, 'yyyy-MM-dd')}
                      dayData={getDayData(format(day, 'yyyy-MM-dd'))}
                      onDateClick={onDateClick}
                    />
                  ) : (
                    <div key={`empty-${dayIndex}`} style={{ width: '12px', height: '12px' }} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end mt-4 gap-2 pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>Less</span>
          <div className="flex" style={{ gap: '3px' }}>
            <div className="heatmap-cell-empty" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
            <div className="heatmap-cell-level-1" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
            <div className="heatmap-cell-level-2" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
            <div className="heatmap-cell-level-3" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
            <div className="heatmap-cell-level-4" style={{ width: '12px', height: '12px', borderRadius: '2px' }} />
          </div>
          <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>More</span>
        </div>
      </div>
    </div>
  );
};
